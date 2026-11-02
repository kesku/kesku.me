"""Exercise migration, publication and rollback using only disposable sites."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import importlib.util
import os
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch
from urllib.request import urlopen

spec = importlib.util.spec_from_file_location(
    "deploy", Path(__file__).resolve().parents[1] / "scripts" / "deploy.py")
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


def site(path, label, asset):
    (path / "_astro").mkdir(parents=True)
    (path / "index.html").write_text(
        f'<link rel="stylesheet" href="/_astro/{asset}"><h1>{label}</h1>')
    (path / "_astro" / asset).write_text(label + " css")


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.webroot = self.base / "html"
        self.root = self.base / "site"
        site(self.webroot, "old", "old.css")
        self.before = deploy.manifest(self.webroot)
        self.bad_asset = False
        owner = self

        class Handler(SimpleHTTPRequestHandler):
            def log_message(self, *args):
                pass

            def do_GET(self):
                if owner.bad_asset and self.path == "/_astro/new.css":
                    self.send_response(200)
                    self.end_headers()
                    self.wfile.write(b"wrong content despite HTTP 200")
                else:
                    super().do_GET()

        self.server = ThreadingHTTPServer(
            ("127.0.0.1", 0), partial(Handler, directory=str(self.webroot)))
        self.thread = threading.Thread(target=self.server.serve_forever)
        self.thread.start()
        self.addCleanup(self.stop_server)
        self.url = f"http://127.0.0.1:{self.server.server_port}"
        self.source = self.base / "dist"
        site(self.source, "new", "new.css")

    def stop_server(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()

    def migrate(self):
        deploy.migrate(self.webroot, self.root, self.url, "kesku.me")

    def publish(self, name="new"):
        deploy.publish(self.source, self.root, name, self.url, "kesku.me")

    def get(self, path="/"):
        with urlopen(self.url + path, timeout=5) as response:
            return response.read()

    def test_migration_preserves_every_file_and_original_directory(self):
        expected = self.get()
        self.migrate()
        self.assertTrue(self.webroot.is_symlink())
        self.assertEqual(deploy.manifest(self.webroot), self.before)
        self.assertEqual(deploy.manifest(self.root / "original-webroot"), self.before)
        self.assertEqual(self.get(), expected)

    def test_migration_failure_restores_original_directory(self):
        with patch.object(deploy, "probe", side_effect=RuntimeError("fixture")):
            with self.assertRaises(RuntimeError):
                self.migrate()
        self.assertFalse(self.webroot.is_symlink())
        self.assertEqual(deploy.manifest(self.webroot), self.before)
        self.assertEqual(list(self.base.glob(".kesku-migrate-*")), [])

    def test_publish_verifies_content_and_keeps_old_assets(self):
        self.migrate()
        self.publish()
        self.assertEqual(self.get(), (self.source / "index.html").read_bytes())
        self.assertEqual(self.get("/_astro/old.css"), b"old css")
        self.assertEqual(self.get("/_astro/new.css"), b"new css")
        self.assertEqual(os.readlink(self.root / "previous"), "releases/original")
        self.assertEqual(deploy.manifest(self.root / "original-webroot"), self.before)

    def test_wrong_asset_body_with_http_200_rolls_back(self):
        self.migrate()
        self.bad_asset = True
        with self.assertRaises(RuntimeError):
            self.publish()
        self.assertEqual(os.readlink(self.root / "current"), "releases/original")
        self.assertIn(b"<h1>old</h1>", self.get())
        self.assertFalse((self.root / "previous").exists())

    def test_interrupted_publish_rolls_back(self):
        self.migrate()
        with patch.object(deploy, "probe", side_effect=KeyboardInterrupt):
            with self.assertRaises(KeyboardInterrupt):
                self.publish()
        self.assertEqual(os.readlink(self.root / "current"), "releases/original")

    def test_immutable_asset_collision_keeps_current_site(self):
        self.migrate()
        (self.source / "_astro" / "old.css").write_text("different content")
        with self.assertRaises(ValueError):
            self.publish()
        self.assertEqual(os.readlink(self.root / "current"), "releases/original")

    def test_invalid_build_or_release_never_switches_current(self):
        self.migrate()
        with self.assertRaises(ValueError):
            self.publish("../outside")
        (self.source / "index.html").unlink()
        with self.assertRaises(ValueError):
            self.publish("missing-index")
        self.assertEqual(os.readlink(self.root / "current"), "releases/original")

    def test_symlink_build_is_rejected(self):
        self.migrate()
        (self.source / "leak").symlink_to(self.base)
        with self.assertRaises(ValueError):
            self.publish()
        self.assertEqual(os.readlink(self.root / "current"), "releases/original")

    def test_existing_release_is_never_overwritten(self):
        self.migrate()
        with self.assertRaises(FileExistsError):
            self.publish("original")
        self.assertEqual(deploy.manifest(self.root / "releases" / "original"), self.before)


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3
"""Publish complete static releases without reloading nginx (Linux, stdlib only)."""
import argparse
import ctypes
import fcntl
import hashlib
from html.parser import HTMLParser
import os
from pathlib import Path
import re
import shutil
import signal
import tempfile
from urllib.parse import urlsplit
from urllib.request import ProxyHandler, Request, build_opener


def manifest(directory):
    files = {}
    for path in directory.rglob("*"):
        if path.is_symlink():
            raise ValueError(f"Symlinks are not allowed in static releases: {path.name}")
        if path.is_file():
            files[str(path.relative_to(directory))] = hashlib.sha256(path.read_bytes()).hexdigest()
    return files


def point(link, target):
    temporary = link.with_name(f".{link.name}-{os.getpid()}")
    try:
        temporary.symlink_to(target)
        os.replace(temporary, link)
    finally:
        temporary.unlink(missing_ok=True)


class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in {"src", "href"} and value:
                path = urlsplit(value).path
                if path.startswith("/_astro/") and ".." not in Path(path).parts:
                    self.paths.append(path)


def probe(release, url, host):
    parser = Assets()
    parser.feed((release / "index.html").read_text())
    if not parser.paths:
        raise ValueError("The homepage has no built asset to verify")
    opener = build_opener(ProxyHandler({}))
    for path in ["/", parser.paths[0]]:
        expected = release / ("index.html" if path == "/" else path.lstrip("/"))
        request = Request(url.rstrip("/") + path, headers={
            "Host": host, "Accept-Encoding": "identity", "Cache-Control": "no-cache"})
        with opener.open(request, timeout=5) as response:
            if response.status != 200 or response.read(8 * 1024 * 1024) != expected.read_bytes():
                raise RuntimeError(f"HTTP content verification failed for {path}")


def current_release(root):
    current = root / "current"
    if not current.is_symlink():
        raise ValueError("Run the one-time migration before publishing")
    release = current.resolve(strict=True)
    if release.parent != (root / "releases").resolve():
        raise ValueError("Current release is outside the release directory")
    return release


def publish(source, root, name, url, host):
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,119}", name):
        raise ValueError("Invalid release name")
    with (root / ".deploy.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        old = current_release(root)
        if not (source / "index.html").is_file():
            raise ValueError("Build has no index.html")
        manifest(source)
        release = root / "releases" / name
        shutil.copytree(source, release)
        # Already-open pages may still request preceding hashed assets.
        if (old / "_astro").exists():
            for path in (old / "_astro").rglob("*"):
                if path.is_file():
                    target = release / path.relative_to(old)
                    if target.exists():
                        if target.read_bytes() != path.read_bytes():
                            raise ValueError(f"Immutable asset changed: {path.name}")
                    else:
                        target.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(path, target)
        previous = os.readlink(root / "current")
        try:
            point(root / "current", str(release.relative_to(root)))
            probe(release, url, host)
            point(root / "previous", previous)
        except BaseException:
            point(root / "current", previous)
            raise
        print(f"Deployed {name}; previous release retained: {old.name}")


def exchange(first, second):
    libc = ctypes.CDLL(None, use_errno=True)
    rename = libc.renameat2
    rename.argtypes = [ctypes.c_int, ctypes.c_char_p, ctypes.c_int, ctypes.c_char_p, ctypes.c_uint]
    rename.restype = ctypes.c_int
    if rename(-100, os.fsencode(first), -100, os.fsencode(second), 2):
        raise OSError(ctypes.get_errno(), "Atomic directory exchange failed")


def migrate(webroot, root, url, host):
    if webroot.is_symlink() or not webroot.is_dir() or root.exists():
        raise ValueError("Migration requires the original directory and a new release root")
    original = manifest(webroot)
    release = root / "releases" / "original"
    release.parent.mkdir(parents=True)
    shutil.copytree(webroot, release)
    if original != manifest(release):
        raise RuntimeError("Copied site differs from the original")
    point(root / "current", "releases/original")
    fd, name = tempfile.mkstemp(prefix=".kesku-migrate-", dir=webroot.parent)
    os.close(fd)
    temporary = Path(name)
    temporary.unlink()
    temporary.symlink_to(root / "current")
    switched = False
    try:
        exchange(webroot, temporary)
        switched = True
        probe(release, url, host)
    except BaseException:
        if switched:
            exchange(webroot, temporary)
        temporary.unlink(missing_ok=True)
        raise
    temporary.rename(root / "original-webroot")
    print("Migration verified: original site preserved; nginx configuration unchanged")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["publish", "migrate"])
    parser.add_argument("--source", type=Path, default=Path("dist"))
    parser.add_argument("--root", type=Path, default=Path("/var/www/kesku-site"))
    parser.add_argument("--webroot", type=Path, default=Path("/var/www/html"))
    parser.add_argument("--release")
    parser.add_argument("--url", default="http://127.0.0.1")
    parser.add_argument("--host", default="kesku.me")
    args = parser.parse_args()
    # Cancellation must reach the rollback handler after a link switch.
    def interrupted(signum, frame):
        raise SystemExit(128 + signum)
    signal.signal(signal.SIGTERM, interrupted)
    if args.action == "migrate":
        migrate(args.webroot, args.root, args.url, args.host)
    else:
        if not args.release:
            parser.error("publish requires --release")
        publish(args.source, args.root, args.release, args.url, args.host)


if __name__ == "__main__":
    main()

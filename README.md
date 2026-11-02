# kesku.me

Personal website built with Astro

## Deployment

Deployment is configured for my personal Proxmox homelab hosting via a Cloudflare Tunnel.

Pushes to `master` build on the existing `kesku-me` self-hosted runner. Bun is
pinned to 1.3.14, installs use `--frozen-lockfile`, and deployments run one at a
time. Manual workflow dispatch with `publish=false` tests and builds without
changing the live site.

The workflow publishes a complete release under `/var/www/kesku-site/releases`,
then atomically switches `current`. Nginx continues serving `/var/www/html`,
which points to `current`; no nginx reload or sudo is needed for a deployment.
The homepage and a built asset must match the staged files over HTTP. Failure
or interruption during verification restores the preceding release. Old hashed
assets are carried forward so already-open pages can still load them.

The first migration is an operator-only step, not a workflow action:

```bash
python3 scripts/deploy.py migrate
chown -hR deploy:deploy /var/www/kesku-site
```

It copies and verifies the existing site, uses Linux's atomic directory exchange
to replace the webroot with a symlink, and retains the original directory at
`/var/www/kesku-site/original-webroot`. It changes no nginx configuration and
does not restart or reload nginx or the runner. Existing roots or unexpected
symlinks cause migration to stop rather than overwrite them.

`current` and `previous` identify the active and last successful releases. For a
manual rollback, run as the deploy user while no deployment is active:

```bash
cd /var/www/kesku-site
flock .deploy.lock sh -eu -c '
  ln -s "$(readlink previous)" .manual-rollback
  mv -Tf .manual-rollback current
'
curl --fail -H 'Host: kesku.me' http://127.0.0.1/
```

Releases and failed candidates are retained for inspection; this small site has
no automatic deletion job. Tests use temporary sites and a loopback HTTP server:
`python3 -m unittest discover -s tests -p 'test_deploy.py' -v`.

## Local development

```bash
bun install
bun dev
# build:
bun run build
# preview the built site:
bun run preview
```

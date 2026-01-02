# kesku.me

Personal website built with Astro

## Deployment

Deployment is configured for my personal Proxmox homelab hosting via Cloudflare Tunnel.

See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) for complete setup instructions.

**Current setup:**

- Self-hosted GitHub Actions runner (inside LXC)
- Automated deployments on push to `main`
- Nginx serving static files
- Cloudflare Tunnel for ingress

**Rollback:** DNS can be switched back to Cloudflare Pages instantly (no repo changes needed).

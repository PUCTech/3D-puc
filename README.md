# 3d-puc

3D campus map of PUC-SP Consolação. See docs/superpowers/specs/.

## Deploy

GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck and build on every PR and push to `main`, then deploys with the Vercel CLI:

- **Pull requests:** a preview deploy. The URL is posted as a PR comment and updated on each push.
- **Push to `main`:** a production deploy.

The Vercel project lives on a personal Vercel account, so Vercel's own Git integration isn't used.

One-time setup, as a repo admin:

1. Create a token at https://vercel.com/account/tokens.
2. Link a local clone to get the IDs: run `npx vercel link`, then `cat .vercel/project.json` (it has `orgId` and `projectId`).
3. Add three repository secrets (Settings → Secrets and variables → Actions): `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE). Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL).

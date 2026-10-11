# Contributing

Thanks for helping with 3d-puc, a 3D campus map of PUC-SP Consolação.

## Setup

```bash
npm install
npm run dev     # http://localhost:3000
```

Before opening a PR, make sure these pass (CI runs the same):

```bash
npm run lint
npm run typecheck
npm run build
```

> This project uses a recent Next.js with breaking changes. See `AGENTS.md` and `node_modules/next/dist/docs/` before changing framework-level code.

## Workflow

1. Fork or branch from `main`. Use a prefix: `feat/`, `fix/`, `chore/`, `docs/`, `ci/`.
2. Keep PRs small and focused on one change.
3. Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat: …`, `fix: …`).
4. Open a PR against `main`. CI posts a Vercel preview link; check the scene there.
5. For visual changes, include a screenshot.

## Content

- UI strings live in `messages/`. Add every string in all locales.
- Building footprints come from OpenStreetMap via `npm run import:footprints`. Don't hand-edit generated data in `data/`; change the script instead.

## Reporting bugs

Open an issue with steps to reproduce, browser/OS, and a screenshot if it's visual.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).

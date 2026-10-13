# Contributing

Thanks for helping with 3d-puc, a 3D campus map of PUC-SP Consolação. Code, translations, data corrections, history research, and bug reports are all welcome.

By taking part you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to help

- **Report a bug** or a wrong detail on the map (a room, an entrance, a floor).
- **Fix or improve the data**: floors, rooms, entrances, history texts, photo credits.
- **Improve the 3D scene**: realism, performance, mobile behavior.
- **Translate or proofread** UI strings and history texts.
- **Improve the docs.**

Not sure where to start? Open an issue describing what you'd like to do before spending a lot of time on it.

## Setup

You need Node.js 20 or newer.

```bash
git clone https://github.com/PUCTech/3D-puc.git
cd 3D-puc
npm install
npm run dev     # http://localhost:3000
```

Before opening a PR, make sure these pass (CI runs the same):

```bash
npm run lint
npm run typecheck
npm run build
```

> This project uses a recent Next.js with breaking changes. See [AGENTS.md](AGENTS.md) and `node_modules/next/dist/docs/` before changing framework-level code.

There is no test suite yet. Check your change in the browser, on desktop and in a phone-sized viewport, in both locales (`/pt` and `/en`).

## Workflow

1. Fork the repo, or branch from `main` if you have access. Use a prefix: `feat/`, `fix/`, `chore/`, `docs/`, `ci/`.
2. Keep PRs small and focused on one change.
3. Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat: …`, `fix: …`, `docs: …`).
4. Open a PR against `main` and fill in the template. CI posts a Vercel preview link for PRs from the main repo; use it to check the scene.
5. For visual changes, include a screenshot. For 3D changes, a before/after is ideal.
6. Respond to review comments by pushing more commits. A maintainer will squash or merge when it's ready.

## Where things live

| You want to change… | Look at… |
|---------------------|----------|
| A building, floor, room, entrance or style | `data/campus.json` (types in `lib/campus.ts`) |
| History text or photos | `data/history.json`, `public/history/` |
| A UI string | `messages/pt.json` and `messages/en.json` |
| How the 3D world is drawn | `components/scene/` |
| Panels, search, toggles | `components/ui/` and `components/MapApp.tsx` |
| URL state (`b`, `f`, `nivel`, `noite`, `epoca`) | `components/MapApp.tsx` |

The [README](README.md) has the full code layout and the coordinate system (local meters, `x` east, `z` south, `y` up).

## Guidelines

### Code

- Match the surrounding code: naming, comment density, idioms. Prefer small, clear changes over new abstractions.
- Comment the *why*, not the *what*.
- Keep text, search and panels in the DOM, not in WebGL. The list fallback relies on it.
- Watch performance. The target is a phone on mobile data. Avoid per-frame allocations, merge static geometry where you can, and don't add heavy dependencies for small jobs.
- Keep accessibility in mind: real buttons, labels, focus states, sufficient contrast.

### Content and data

- Add every UI string to **all locales** in `messages/`. Portuguese is the default locale.
- Building footprints come from OpenStreetMap via `npm run import:footprints`. Re-runs merge, so hand-written fields stay. Don't hand-edit imported footprints or streets; change the script, or fix the data upstream in OSM.
- **Be honest about certainty.** Layouts from the 1942 plans are facts. Layouts guessed from photos or reports must be marked `estimated` and are labelled as such in the UI. Don't present a guess as a plan.
- **Cite sources.** New history text or facts need a source added to the `sources` list in `data/history.json` (and noted in `docs/consolacao/sources.md` when it's research).
- **Photos need a right to use.** Only add archive photos you may legally use, with `credit`, `year` and a caption in both languages. Never copy images from sources that don't allow reuse.
- Visual choices that aren't obvious go in [docs/realism-log.md](docs/realism-log.md).

### Commits and PRs

- One logical change per commit.
- The PR description says what changed and why, not only how.
- Don't mix refactors with behavior changes.

## Reporting bugs

Open an issue with:

- What you expected and what happened.
- Steps to reproduce, including the URL (it carries the view state).
- Browser, OS and device.
- A screenshot or screen recording if it's visual.

For a wrong or missing detail on the campus, say where it is (building, floor, room) and how you know, ideally with a source or photo.

## Security

If you find a security problem, please don't open a public issue. Contact a maintainer as described in the [Code of Conduct](CODE_OF_CONDUCT.md#reporting).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE). Archive photos and brand marks keep their own rights, see the README.

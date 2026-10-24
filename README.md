# A little closer

A lightweight browser animation built with Canvas 2D and Vite. All characters, props, and effects are drawn locally; no image service, API keys, or backend are required. Optional Google Fonts have system font fallbacks.

## Develop

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Choose Hug, Kiss, Dance, Bench, Sip, or Laugh. The scene enters, then loops until you click the scene, the return button, or press Escape. Characters return to their blocks before another scene begins. Start over resets immediately. Sound is optional and off by default.

## Build

```sh
npm run build
npm run preview
```

The production output is in `dist/`. Deploy its contents with any static web host. This repository contains the actual browser application, rather than links to files in a development workspace.

## Publish a browser link with GitHub Pages

Pushing code to GitHub does not publish the website. To publish:

1. In the repository's **Settings → Pages**, select **GitHub Actions** as the build and deployment source.
2. Open **Actions → Publish website → Run workflow**, select `main`, and run it.
3. Wait for the workflow to succeed. Its deployment job provides the live website link.

The expected address is `https://buildme-100.github.io/hugs/`. It only works after a successful deployment. If the organization restricts Pages or the repository's plan does not support it, GitHub will report that in Settings or the workflow.

Publishing is manual so a code push alone does not expose the website. Run the workflow again when you want to publish changes. The Vite build uses relative asset URLs so it works under GitHub Pages' `/hugs/` path.

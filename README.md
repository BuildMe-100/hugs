# A little closer

A lightweight browser animation built with Canvas 2D and Vite. All characters, props, and effects are drawn locally; no image service, API keys, or backend are required. Optional Google Fonts have system font fallbacks.

## Develop

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Choose Hug, Kiss, Dance, Bench, Sip, or Laugh. The scene enters, then loops until you click the scene, the return button, or press Escape. Characters return to their blocks before another scene begins. Start over resets immediately. Sound is optional and off by default.

## Send a moment

Choose a scene, then press **Send**. Supported browsers open the native share sheet, including Messages when available. Other browsers show a copyable link and an **Open a text message** option. The site never sends a message without the user's choice in their messaging app.

Links such as `https://buildme-100.github.io/hugs/?moment=hug` automatically play that moment when opened. All six scene IDs are supported: `hug`, `kiss`, `dance`, `bench`, `sip`, `laugh`. Recipients can return to the blocks, try another scene, and use **Send … back** to share their own choice. No account, server, or personal information is needed; links only contain the scene ID. Unknown scene IDs open the normal home screen.

## Build

```sh
npm run build
npm run preview
```

The production output is in `dist/`. Deploy its contents with any static web host. This repository contains the actual browser application, rather than links to files in a development workspace.

## Publish a browser link with GitHub Pages

Pushing code to GitHub does not publish the website. To publish:

For the simplest setup, choose **Deploy from a branch**, branch **main**, folder **/ (root)** in **Settings → Pages**. This app also runs directly from its source files without a build step. Its relative stylesheet and script paths work under `/hugs/`. GitHub automatically republishes this setup after a push.

Alternatively, to publish the production Vite build with Actions:

1. In the repository's **Settings → Pages**, select **GitHub Actions** as the build and deployment source.
2. Open **Actions → Publish website → Run workflow**, select `main`, and run it.
3. Wait for the workflow to succeed. Its deployment job provides the live website link.

The expected address is `https://buildme-100.github.io/hugs/`. It only works after a successful deployment. If the organization restricts Pages or the repository's plan does not support it, GitHub will report that in Settings or the workflow.

Publishing is manual so a code push alone does not expose the website. Run the workflow again when you want to publish changes. The Vite build uses relative asset URLs so it works under GitHub Pages' `/hugs/` path.

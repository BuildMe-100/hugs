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

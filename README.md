# KirCraftClient

A light Electron client for **KirCraft** (`https://kircraft.lukeskywalk.com`).
Built from the publikc / Juice client lineage, trimmed down to a focused feature set.

## Features

**Graphics / Performance**
- Performance Chromium switches (GPU rasterization, zero-copy, VRAM detection, raster threads, etc.)
- Unlimited FPS
- In-Process GPU
- Auto Fullscreen

**UI / CSS**
- Enable CSS toggle
- External CSS link (`@import`)
- Quick CSS (inline editor)

**Client**
- Discord Rich Presence
- Custom user scripts loaded from `~/Documents/kircraftclient/scripts/*.js`
- Menu theme (11 presets + custom theme colors & font)
- Menu opacity
- Proxy URL selector (currently the main `kircraft.lukeskywalk.com`)
- Resource swapper (`~/Documents/kircraftclient/swapper/assets/`) + Open Swapper Folder
- Open Scripts Folder
- Import / Export / Reset settings

**About**
- KirkaTrades link + credits

## Build & Development

- `npm install` — install dependencies
- `npm run start` — compile TypeScript and launch Electron
- `npm run compile` — compile and copy assets
- `npm run build` — production compile (minified) + electron-builder package

## Layout

```
src/main.ts              — Electron main process entry
src/windows/game.ts      — BrowserWindow creation, IPC, settings store
src/preload/game.ts      — Renderer preload (CSS theme, scripts, notifications)
src/preload/menu.ts      — Overlay settings menu
src/addons/swapper.ts    — Local asset replacement
src/addons/rpc.ts        — Discord Rich Presence
src/util/switches.ts     — Chromium command-line flags
src/util/shortcuts.ts    — Keyboard shortcuts
src/util/defaults.json   — Default settings + allowed proxy URLs
```

## Notes

- The Discord RPC reuses an existing Discord application id. To fully rebrand,
  create your own Discord application, upload an asset named `kircraft`, and
  update `src/addons/rpc.ts` (`clientId` + `largeImageKey`).
- User scripts must be `.js` files (they are `require()`'d into the page).

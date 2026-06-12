// Regenerates the desktop-client app icons from icon.master.png (1024x1024).
//
//   npm run icons
//
// Uses electron-icon-builder (pure JS — no macOS `iconutil`/`sips` needed, so
// it works on Windows/Linux too) to emit:
//   - icon.icns : full retina set (16 → 1024, incl. @2x) for the macOS app
//   - icon.ico  : multi-size (16/24/32/48/64/128/256) for the Windows app
//   - icon.png  : 512×512, used for the Linux app icon AND the runtime
//                 BrowserWindow/taskbar icon (see windows/game.ts)
//
// Drop a new 1024×1024 icon.master.png in this folder and re-run to refresh
// every platform from one source. electron-builder reads these from
// dist/assets/img/ (copied there by `copy-assets`); paths are set in
// electron-builder.yml.
const { execSync } = require('child_process');
const fs = require('fs');

const TMP = '.iconsgen';
execSync(`npx --yes electron-icon-builder --input=icon.master.png --output=${TMP} --flatten`, { stdio: 'inherit' });

const src = `${TMP}/icons/`;
const dst = 'src/assets/img/';
fs.copyFileSync(src + 'icon.icns',  dst + 'icon.icns');
fs.copyFileSync(src + 'icon.ico',   dst + 'icon.ico');
fs.copyFileSync(src + '512x512.png', dst + 'icon.png');
fs.rmSync(TMP, { recursive: true, force: true });
console.log('✓ Icons regenerated → ' + dst + ' (icon.icns / icon.ico / icon.png)');

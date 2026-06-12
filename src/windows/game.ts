import { BrowserWindow, ipcMain, app, shell, dialog } from "electron";
import { default_settings, allowed_urls } from "../util/defaults.json";
import { registerShortcuts } from "../util/shortcuts";
import { applySwitches } from "../util/switches";
import DiscordRPC from "../addons/rpc";
import * as path from "path";
import Store from "electron-store";
import * as fs from "fs";
import type { Settings } from '../types';

const store = new Store();
if (!store.has("settings")) {
  store.set("settings", default_settings);
}

const settings = store.get("settings") as Settings;

for (const key in default_settings) {
  if (
    !settings.hasOwnProperty(key) ||
    typeof settings[key] !== typeof (default_settings as Settings)[key]
  ) {
    settings[key] = (default_settings as Settings)[key];
    store.set("settings", settings);
  }
}

if (!allowed_urls.includes(settings.base_url)) {
  settings.base_url = default_settings.base_url;
  store.set("settings", settings);
}

ipcMain.on("get-settings", (e) => {
  e.returnValue = settings;
});

ipcMain.on("update-setting", (e, key: string, value: any) => {
  settings[key] = value;
  store.set("settings", settings);
});

ipcMain.on("open-swapper-folder", () => {
  const swapperPath = path.join(
    app.getPath("documents"),
    "kircraftclient/swapper/assets"
  );

  if (!fs.existsSync(swapperPath)) {
    fs.mkdirSync(swapperPath, { recursive: true });
  }
  shell.openPath(swapperPath);
});

ipcMain.on("open-scripts-folder", () => {
  const scriptsFolder = path.join(
    app.getPath("documents"),
    "kircraftclient/scripts"
  );

  if (!fs.existsSync(scriptsFolder)) {
    fs.mkdirSync(scriptsFolder, { recursive: true });
  }
  shell.openPath(scriptsFolder);
});

ipcMain.on("reset-juice-settings", () => {
  store.set("settings", default_settings);
  app.relaunch();
  app.quit();
});

const scriptsPath = path.join(
  app.getPath("documents"),
  "kircraftclient",
  "scripts"
);
if (!fs.existsSync(scriptsPath)) {
  fs.mkdirSync(scriptsPath, { recursive: true });
}

ipcMain.on("get-scripts-path", (e) => {
  e.returnValue = scriptsPath;
});

// Lets the user pick a font file for the custom menu theme. The chosen file is
// copied into userData/fonts so it survives even if the original is moved, and
// the stored copy's path is handed back to the renderer for @font-face use.
ipcMain.handle("upload-custom-font", async () => {
  const picked = (await dialog.showOpenDialog({
    title: "Choose a font file",
    properties: ["openFile"],
    filters: [{ name: "Fonts", extensions: ["ttf", "otf", "woff", "woff2"] }],
  })) as unknown as { canceled: boolean; filePaths: string[] };

  const source = picked.filePaths && picked.filePaths[0];
  if (picked.canceled || !source) return null;

  const fontsDir = path.join(app.getPath("userData"), "fonts");
  if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
  }

  const destination = path.join(fontsDir, path.basename(source));
  fs.copyFileSync(source, destination);
  return destination;
});

ipcMain.handle("remove-custom-font", (_e, fontPath: string) => {
  try {
    if (fontPath && fs.existsSync(fontPath)) fs.unlinkSync(fontPath);
  } catch {}
  return true;
});

let gameWindow: BrowserWindow & { DiscordRPC?: DiscordRPC } | null;

applySwitches(settings);

const createWindow = (): void => {
  gameWindow = new BrowserWindow({
    fullscreen: settings.auto_fullscreen,
    icon: path.join(__dirname, "../assets/img/icon.png"),
    title: "KirCraftClient",
    width: 1280,
    height: 720,
    show: false,
    backgroundColor: "#141414",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      // The preload uses Node built-ins (fs/path) and require()s user scripts
      // into the page, which the default renderer sandbox (on since Electron
      // 20) forbids — so it must stay off, paired with contextIsolation:false.
      sandbox: false,
      webSecurity: false,
      preload: path.join(__dirname, "../preload/game.js"),
    },
  });

  gameWindow.once("ready-to-show", () => {
    gameWindow!.show();
  });

  // `new-window` was removed in Electron 22 — open external links in the
  // user's browser via the window-open handler instead.
  gameWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  gameWindow.webContents.on("did-navigate-in-page", (e, url) => {
    gameWindow!.webContents.send("url-change", url);

    if (settings.discord_rpc && gameWindow!.DiscordRPC) {
      gameWindow!.DiscordRPC.setState("Playing KirCraft");
    }
  });

  gameWindow.loadURL(settings.base_url);
  gameWindow.webContents.setUserAgent(
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.116 Safari/537.36 Electron/10.4.7 KirCraftClient/${app.getVersion()}`
  );
  gameWindow.removeMenu();
  gameWindow.maximize();

  registerShortcuts(gameWindow);

  gameWindow.on("page-title-updated", (e) => e.preventDefault());

  gameWindow.on("closed", () => {
    if (gameWindow?.DiscordRPC) {
      gameWindow.DiscordRPC.destroy();
    }
    ipcMain.removeAllListeners("get-settings");
    ipcMain.removeAllListeners("update-setting");
    gameWindow = null;
  });
};

export const initGame = (): void => {
  createWindow();
  if (settings.discord_rpc) {
    gameWindow!.DiscordRPC = new DiscordRPC();
  }
};

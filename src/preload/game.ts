import Menu from "./menu";
import { ipcRenderer } from "electron";
import * as fs from "fs";
import * as path from "path";
import type { Settings, NotificationData, SettingsChangedEvent } from '../types';

const scriptsPath: string = ipcRenderer.sendSync("get-scripts-path");
let scripts: string[] = [];
try {
  scripts = fs.readdirSync(scriptsPath);
} catch {}

const settings: Settings = ipcRenderer.sendSync("get-settings");

// Keep the renderer-side settings mirror in sync with menu changes so features
// like the CSS theme react live without a reload.
document.addEventListener("juice-settings-changed", (event: Event) => {
  const e = event as SettingsChangedEvent;
  settings[e.detail.setting] = e.detail.value;
});

// Backslashes in file:// paths break url() in CSS — normalize to forward slashes.
const formatLink = (link: string): string => link.replace(/\\/g, "/");

// Loads user scripts from Documents/kircraftclient/scripts. Plain .js files are
// require()'d so they run in the page context (contextIsolation is off).
const loadUserScripts = (): void => {
  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    if (!script.endsWith(".js")) continue;
    const scriptPath = path.join(scriptsPath, script);
    try {
      require(scriptPath);
    } catch {}
  }
};

// Enable CSS / CSS Link / Quick CSS. `css_enabled` gates the external @import
// link; the quick-CSS textarea is always applied when present.
const loadTheme = (): void => {
  const addedStyles = document.createElement("style");
  addedStyles.id = "kircraft-styles-theme";
  document.head.appendChild(addedStyles);

  const customStyles = document.createElement("style");
  customStyles.id = "kircraft-styles-custom";
  document.head.appendChild(customStyles);

  const updateTheme = (): void => {
    const cssLink = settings.css_link;
    const advancedCSS = settings.advanced_css;

    if (cssLink && settings.css_enabled) {
      addedStyles.innerHTML = `@import url('${formatLink(cssLink)}');`;
    } else {
      addedStyles.innerHTML = "";
    }

    customStyles.innerHTML = advancedCSS;
  };

  document.addEventListener("juice-settings-changed", (e: Event) => {
    const customEvent = e as SettingsChangedEvent;
    if (
      customEvent.detail.setting === "css_link" ||
      customEvent.detail.setting === "css_enabled" ||
      customEvent.detail.setting === "advanced_css"
    ) {
      updateTheme();
    }
  });

  updateTheme();
};

const customNotification = (data: NotificationData): void => {
  const notifElement = document.createElement("div");
  notifElement.classList.add("vue-notification-wrapper");
  notifElement.style.cssText =
    "transition-timing-function: ease; transition-delay: 0s; transition-property: all;";
  notifElement.innerHTML = `
  <div
    style="
      display: flex;
      align-items: center;
      padding: .9rem 1.1rem;
      margin-bottom: .5rem;
      color: var(--white);
      cursor: pointer;
      box-shadow: 0 0 0.7rem rgba(0,0,0,.25);
      border-radius: .2rem;
      background: linear-gradient(262.54deg,#202639 9.46%,#223163 100.16%);
      margin-left: 1rem;
      border: solid .15rem #ffb914;
      font-family: Exo\ 2;" class="alert-default"
  > ${data.icon
      ? `
      <img
        src="${data.icon}"
        style="
          min-width: 2rem;
          height: 2rem;
          margin-right: .9rem;"
      />`
      : ""
    }
    <span style="font-size: 1rem; font-weight: 600; text-align: left;" class="text">${data.message
    }</span>
  </div>`;

  const notifGroups = document.getElementsByClassName("vue-notification-group");
  if (notifGroups[0] && notifGroups[0].children[0]) {
    notifGroups[0].children[0].appendChild(notifElement);
  }

  setTimeout(() => {
    try {
      notifElement.remove();
    } catch {}
  }, 5000);
};

loadUserScripts();

document.addEventListener("DOMContentLoaded", () => {
  const menu = new Menu();
  menu.init();
  loadTheme();
});

ipcRenderer.on("notification", (_: any, data: NotificationData) => customNotification(data));

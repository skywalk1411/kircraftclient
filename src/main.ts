require("v8-compile-cache");
import { app } from "electron";
import { initGame } from "./windows/game";
import { initResourceSwapper } from "./addons/swapper";

app.on("ready", async () => {
  await initResourceSwapper();
  initGame();
});

app.on("window-all-closed", () => app.quit());

import * as rpc from "discord-rpc";
import { version } from "../../package.json";

interface Activity {
  startTimestamp: number;
  state: string;
  largeImageKey: string;
  largeImageText: string;
  instance: boolean;
  buttons: Array<{ label: string; url: string }>;
}

class DiscordRPC {
  private clientId: string;
  private startTimestamp: number;
  private client: rpc.Client;

  constructor() {
    // Reuses an existing Discord application id. To fully rebrand the rich
    // presence, create your own Discord application, upload an art asset named
    // "kircraft", and swap the id below + largeImageKey for it.
    this.clientId = "1511871598917976124";
    this.startTimestamp = Date.now();
    this.client = new rpc.Client({ transport: "ipc" });
    this.init();
  }

  private init(): void {
    this.client.on("ready", () => this.setActivity());
    this.client.on("disconnected", () => this.login());
    this.login();
  }

  private login(): void {
    this.client.login({ clientId: this.clientId }).catch(() => {});
  }

  setActivity(activity: Activity = this.defaultActivity()): void {
    this.client.setActivity(activity).catch(() => {});
  }

  setState(state: string): void {
    const activity = this.defaultActivity();
    activity.state = state;
    this.setActivity(activity);
  }

  destroy(): void {
    this.client.destroy().catch(() => {});
  }

  private defaultActivity(): Activity {
    return {
      startTimestamp: this.startTimestamp,
      state: "Playing KirCraft",
      largeImageKey: "publikc",
      largeImageText: `KirCraftClient v${version}`,
      instance: false,
      buttons: [
        { label: "Discord", url: "https://discord.gg/jPgezmpNwm" },
      ],
    };
  }
}

export default DiscordRPC;

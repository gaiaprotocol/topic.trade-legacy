import { Activatable, el } from "@common-module/app";
import { MePanel } from "fsesf";

export default class SettingsTab extends Activatable {
  constructor() {
    super(".app-tab.settings-tab");
    this.append(
      el("h1", "Settings"),
      el("main", new MePanel()),
    );
  }
}

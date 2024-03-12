import { Activatable, el } from "@common-module/app";
import { MeSection } from "fsesf";

export default class SettingsTab extends Activatable {
  constructor() {
    super(".app-tab.settings-tab");
    this.append(
      el("h1", "Settings"),
      new MeSection(),
    );
  }
}

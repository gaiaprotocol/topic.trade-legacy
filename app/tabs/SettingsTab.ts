import { Activatable, el } from "@common-module/app";
import { MePanel } from "fsesf";

export default class SettingsTab extends Activatable {
  private mePanel: MePanel;

  constructor() {
    super(".app-tab.settings-tab");
    this.append(
      el("h1", "Settings"),
      el("main", this.mePanel = new MePanel()),
    );
  }

  public activeHashtag(hashtag: string) {
    this.mePanel.activeHashtag(hashtag);
  }

  public deactiveHashtag() {
    this.mePanel.deactiveHashtag();
  }
}

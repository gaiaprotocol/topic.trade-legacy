import { Activatable, el } from "@common-module/app";
import { ActivityList } from "fsesf";

export default class ActivityTab extends Activatable {
  constructor() {
    super(".app-tab.activity-tab");
    this.append(
      el("h1", "Activities"),
      el("main", new ActivityList()),
    );
  }
}

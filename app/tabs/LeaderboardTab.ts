import { Activatable, el } from "@common-module/app";
import { HashtagLeaderboard, HashtagSearchBar } from "fsesf";

export default class LeaderboardTab extends Activatable {
  constructor() {
    super(".app-tab.leaderboard-tab");
    this.append(
      el("h1", "Leaderboard"),
      new HashtagSearchBar(),
      el("main", new HashtagLeaderboard()),
    );
  }
}

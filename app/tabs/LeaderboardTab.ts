import { Activatable, el } from "@common-module/app";
import { HashtagLeaderboard, HashtagSearchBar } from "fsesf";

export default class LeaderboardTab extends Activatable {
  private hashtagLeaderboard: HashtagLeaderboard;

  constructor() {
    super(".app-tab.leaderboard-tab");
    this.append(
      el("h1", "Leaderboard"),
      new HashtagSearchBar(),
      el("main", this.hashtagLeaderboard = new HashtagLeaderboard()),
    );
  }

  public activeHashtag(hashtag: string) {
    this.hashtagLeaderboard.activeHashtag(hashtag);
  }

  public deactiveHashtag() {
    this.hashtagLeaderboard.deactiveHashtag();
  }
}

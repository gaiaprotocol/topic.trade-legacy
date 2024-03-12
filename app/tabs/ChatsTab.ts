import { Activatable, el } from "@common-module/app";
import { HashtagList } from "fsesf";

export default class ChatsTab extends Activatable {
  private hashtagList: HashtagList;

  constructor() {
    super(".app-tab.chats-tab");
    this.append(
      el("h1", "Chats"),
      this.hashtagList = new HashtagList(),
    );
  }

  public activeHashtag(hashtag: string) {
    this.hashtagList.activeHashtag(hashtag);
  }

  public deactiveHashtag() {
    this.hashtagList.deactiveHashtag();
  }
}

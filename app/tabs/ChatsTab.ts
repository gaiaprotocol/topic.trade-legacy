import { Activatable, el } from "@common-module/app";
import { HashtagList } from "fsesf";

export default class ChatsTab extends Activatable {
  constructor() {
    super(".app-tab.chats-tab");
    this.append(
      el("h1", "Chats"),
      new HashtagList(),
    );
  }
}

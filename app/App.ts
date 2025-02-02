import {
  AvatarUtil,
  BodyNode,
  BottomMenuTabs,
  DomNode,
  el,
  MaterialIcon,
  Router,
  View,
  ViewParams,
} from "@common-module/app";
import { FCM } from "@common-module/social";
import { HashtagRoom, HashtagUtil, SFEnv, SFSignedUserManager } from "fsesf";
import ActivityTab from "./tabs/ActivityTab.js";
import ChatsTab from "./tabs/ChatsTab.js";
import LeaderboardTab from "./tabs/LeaderboardTab.js";
import SettingsTab from "./tabs/SettingsTab.js";

export default class App extends View {
  private chatsTab: ChatsTab;
  private leaderboardTab: LeaderboardTab;
  private activityTab: ActivityTab;
  private settingsTab: SettingsTab;
  private tabs: BottomMenuTabs;

  private roomSection: DomNode;
  private room: HashtagRoom | undefined;

  constructor() {
    super();

    let settingsIcon;
    if (SFSignedUserManager.user) {
      settingsIcon = el(".avatar");
      AvatarUtil.selectLoadable(settingsIcon, [
        SFSignedUserManager.user.avatar_thumb,
        SFSignedUserManager.user.stored_avatar_thumb,
      ]);
    } else {
      settingsIcon = new MaterialIcon("settings");
    }

    BodyNode.append(
      el(
        "section.app",
        this.chatsTab = new ChatsTab(),
        this.leaderboardTab = new LeaderboardTab(),
        this.activityTab = new ActivityTab(),
        this.settingsTab = new SettingsTab(),
        this.tabs = new BottomMenuTabs(SFEnv.dev ? "test" : undefined, [{
          id: "chats",
          icon: new MaterialIcon("forum"),
        }, {
          id: "leaderboard",
          icon: new MaterialIcon("leaderboard"),
        }, {
          id: "activity",
          icon: new MaterialIcon("browse_activity"),
        }, {
          id: "settings",
          icon: settingsIcon,
        }]),
      ),
      this.roomSection = el("section.room", {
        "data-empty-message": "Select a topic to start messaging",
      }),
    );

    this.tabs.on("select", (id: string) => {
      [
        this.chatsTab,
        this.leaderboardTab,
        this.activityTab,
        this.settingsTab,
      ].forEach((list) => list.deactivate());
      if (id === "chats") this.chatsTab.activate();
      else if (id === "leaderboard") this.leaderboardTab.activate();
      else if (id === "activity") this.activityTab.activate();
      else if (id === "settings") this.settingsTab.activate();
    }).init();
  }

  public changeParams(
    params: ViewParams,
    uri: string,
    hashtagInfo?: any,
  ): void {
    if (params.topic) {
      if (!this.room) {
        this.room = new HashtagRoom(params.topic, hashtagInfo).appendTo(
          this.roomSection,
        );
      } else {
        this.room.enter(params.topic, hashtagInfo);
      }
      [this.chatsTab, this.leaderboardTab, this.settingsTab].forEach((list) =>
        list.activeHashtag(params.topic!)
      );
      this.checkAvailableTopic(params.topic);
    } else {
      this.room?.delete();
      this.room = undefined;
      [this.chatsTab, this.leaderboardTab, this.settingsTab].forEach((list) =>
        list.deactiveHashtag()
      );
    }
  }

  private checkAvailableTopic(topic: string) {
    if (!HashtagUtil.available(topic)) {
      setTimeout(() => Router.goNoHistory("/"));
    } else {
      FCM.closeAllNotifications(`hashtag_${topic}`);
    }
  }
}

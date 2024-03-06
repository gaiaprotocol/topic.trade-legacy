import {
  BodyNode,
  BottomMenuTabs,
  DomNode,
  el,
  MaterialIcon,
  View,
  ViewParams,
} from "@common-module/app";
import {
  ActivityList,
  HashtagLeaderboard,
  HashtagList,
  HashtagRoom,
  MeSection,
} from "fsesf";

export default class App extends View {
  private hashtagList: HashtagList;
  private leaderboard: HashtagLeaderboard;
  private activityList: ActivityList;
  private meSection: MeSection;
  private tabs: BottomMenuTabs;

  private roomSection: DomNode;
  private room: HashtagRoom | undefined;

  constructor(params: ViewParams, uri: string, hashtagInfo?: any) {
    super();
    BodyNode.append(
      el(
        "section.app",
        this.hashtagList = new HashtagList(),
        this.leaderboard = new HashtagLeaderboard(),
        this.activityList = new ActivityList(),
        this.meSection = new MeSection(),
        this.tabs = new BottomMenuTabs(undefined, [{
          id: "chats",
          icon: new MaterialIcon("forum"),
        }, {
          id: "leaderboard",
          icon: new MaterialIcon("leaderboard"),
        }, {
          id: "activity",
          icon: new MaterialIcon("browse_activity"),
        }, {
          id: "me",
          icon: new MaterialIcon("settings"),
        }]),
      ),
      this.roomSection = el("section.room", {
        "data-empty-message": "Select a topic to start messaging",
      }),
    );

    this.tabs.on("select", (id: string) => {
      [
        this.hashtagList,
        this.leaderboard,
        this.activityList,
        this.meSection,
      ].forEach((list) => list.deactivate());
      if (id === "chats") this.hashtagList.activate();
      else if (id === "leaderboard") this.leaderboard.activate();
      else if (id === "activity") this.activityList.activate();
      else if (id === "me") this.meSection.activate();
    }).init();

    if (params.topic) {
      this.room = new HashtagRoom(params.topic, hashtagInfo).appendTo(
        this.roomSection,
      );
    }
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
        this.room.enter(params.topic);
      }
    } else {
      this.room?.delete();
      this.room = undefined;
    }
  }
}

import {
  BodyNode,
  BottomMenuTabs,
  el,
  MaterialIcon,
  View,
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
  private room: HashtagRoom;

  constructor() {
    super();
    BodyNode.append(
      el(
        "section.app",
        this.hashtagList = new HashtagList(),
        this.leaderboard = new HashtagLeaderboard(),
        this.activityList = new ActivityList(),
        this.meSection = new MeSection(),
        new BottomMenuTabs("topic-trade-tabs", [{
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
      el("section.room", this.room = new HashtagRoom(), {
        "data-empty-message": "Select a topic to start messaging",
      }),
    );
  }
}

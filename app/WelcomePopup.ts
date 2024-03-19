import {
  Button,
  el,
  MaterialIcon,
  msg,
  Popup,
  Store,
} from "@common-module/app";
import { SFEnv } from "fsesf";

export default class WelcomePopup extends Popup {
  private store = new Store("welcome");

  constructor() {
    super(".welcome-popup", { barrierDismissible: false });
    this.store.set("skip", true, true);
    this.header.append(el("h1", "Welcome to topic.trade!"));
    this.main.append(
      el(
        "p",
        "Discover a new way to engage with the hottest topics in the crypto world. At topic.trade, you can discuss, trade, and earn from the most talked-about subjects in the ecosystem.",
      ),
    );
    this.footer.append(
      new Button({
        icon: new MaterialIcon("open_in_new"),
        title: "Learn more",
        href: SFEnv.overviewUrl,
        target: "_blank",
      }),
      new Button({
        tag: ".close",
        title: msg("cancel-button"),
        click: () => this.delete(),
      }),
    );
  }

  public static launch() {
    if (new Store("welcome").get("skip") === true) return;
    new WelcomePopup();
  }
}

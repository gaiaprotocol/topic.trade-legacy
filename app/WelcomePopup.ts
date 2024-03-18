import { Button, Popup, Store } from "@common-module/app";
import { SFEnv } from "fsesf";

export default class WelcomePopup extends Popup {
  private store = new Store("welcome");

  constructor() {
    super(".welcome-popup", { barrierDismissible: false });
    this.store.set("skip", true, true);
    this.footer.append(
      new Button({
        href: SFEnv.overviewUrl,
        target: "_blank",
      }),
      new Button({
        click: () => this.delete(),
      }),
    );
  }

  public static launch() {
    //if (new Store("welcome").get("skip") === true) return;
    new WelcomePopup();
  }
}

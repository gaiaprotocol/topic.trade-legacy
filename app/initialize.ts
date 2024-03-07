import {
  AppInitializer,
  AuthUtil,
  el,
  MaterialIconSystem,
  Router,
  SplashLoader,
} from "@common-module/app";
import { inject_fsesf_msg, SFEnv, SFSignedUserManager } from "fsesf";
import App from "./App.js";
import AppConfig from "./AppConfig.js";

export default async function initialize(config: AppConfig) {
  inject_fsesf_msg();
  MaterialIconSystem.launch();

  SFEnv.init({
    serviceName: "topic.trade",
    messageForWalletLinking: "Link Wallet to topic.trade",
    chains: config.chains,
    defaultChain: config.defaultChain,
    contractAddresses: config.contractAddresses,
    hashtagOptions: { name: "topic", baseUri: "" },
  });

  AppInitializer.initialize(
    config.supabaseUrl,
    config.supabaseAnonKey,
    config.dev,
  );

  await SplashLoader.load(el("img", { src: "/images/logo-transparent.png" }), [
    SFSignedUserManager.fetchUserOnInit(),
  ]);

  Router.route(["", "{topic}"], App);

  AuthUtil.checkEmailAccess();
}

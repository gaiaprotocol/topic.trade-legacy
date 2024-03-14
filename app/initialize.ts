import {
  AppInitializer,
  AuthUtil,
  el,
  Router,
  SplashLoader,
} from "@common-module/app";
import {
  inject_fsesf_msg,
  SFEnv,
  SFOnlineUserManager,
  SFSignedUserManager,
  WalletConnectManager,
} from "fsesf";
import { base, baseSepolia } from "viem/chains";
import App from "./App.js";
import AppConfig from "./AppConfig.js";

export default async function initialize(config: AppConfig) {
  inject_fsesf_msg();

  SFEnv.init({
    dev: config.dev,
    serviceName: "topic.trade",
    messageForWalletLinking: "Link Wallet to topic.trade",
    chains: config.chains,
    defaultChain: config.defaultChain,
    contractAddresses: config.contractAddresses,
    hashtagOptions: { name: "topic", baseUri: "" },
    defaultAssetPrice: 68750000000000n,
  });

  AppInitializer.initialize(
    config.supabaseUrl,
    config.supabaseAnonKey,
    config.dev,
  );

  WalletConnectManager.init(config.walletConnectProjectId, [
    base,
    baseSepolia,
  ]);

  await SplashLoader.load(el("img", { src: "/images/logo-transparent.png" }), [
    SFSignedUserManager.fetchUserOnInit(),
  ]);

  SFOnlineUserManager.init();

  Router.route(["", "{topic}"], App);

  AuthUtil.checkEmailAccess();
}

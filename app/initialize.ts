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
import { FCM } from "../../social-module/lib/index.js";

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

  FCM.init(
    {
      apiKey: "AIzaSyBZCRpj9smnz-yIpXC4KVi9RFs23qcxH7M",
      authDomain: "topictrade-8b711.firebaseapp.com",
      projectId: "topictrade-8b711",
      storageBucket: "topictrade-8b711.appspot.com",
      messagingSenderId: "993631591207",
      appId: "1:993631591207:web:d7bec5f0e54efdfe2ee702",
      measurementId: "G-9CNQ54G1CY",
    },
    "BKhZmi9lpQlQhFXwyMNujFGfjXQEfWKNML8S2gzu6hcFGr1pL-vPOTPU5YwtFHJ4poW-Ax7qm9xeR-7AB76eGl4",
  );

  await SplashLoader.load(el("img", { src: "/images/logo-transparent.png" }), [
    SFSignedUserManager.fetchUserOnInit(),
  ]);

  SFOnlineUserManager.init();

  Router.route(["", "{topic}"], App);

  AuthUtil.checkEmailAccess();
}

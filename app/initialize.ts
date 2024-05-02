import {
  AppInitializer,
  AuthUtil,
  BodyNode,
  BrowserInfo,
  el,
  PolyfillUtil,
  Router,
  SplashLoader,
} from "@common-module/app";
import { FCM, PWAInstallOverlay } from "@common-module/social";
import {
  BlockTimeManager,
  CoinbasePay,
  HashtagSubscribeManager,
  inject_fsesf_msg,
  LinkWalletPopup,
  RealtimeActivityManager,
  SFEnv,
  SFOnlineUserManager,
  SFSignedUserManager,
  SignedUserAssetManager,
  WalletConnectManager,
} from "fsesf";
import App from "./App.js";
import AppConfig from "./AppConfig.js";
import WelcomePopup from "./WelcomePopup.js";

export default async function initialize(config: AppConfig) {
  inject_fsesf_msg();

  SFEnv.init({
    dev: config.dev,
    serviceName: "topic.trade",
    overviewUrl:
      "https://gaiaprotocol.notion.site/topic-trade-Leading-the-New-Trends-in-the-Crypto-World-8c67f745819946369b42ca371caec79d?pvs=4",
    socialUrls: {
      github: "https://github.com/gaiaprotocol/topictrade",
      x: "https://x.com/topictrade",
      discord: "https://discord.gg/gaia-protocol-931958830873575474",
    },
    messageForWalletLinking: "Link Wallet to topic.trade",

    chains: config.chains,
    defaultChain: config.defaultChain,
    contractAddresses: config.contractAddresses,

    hashtagOptions: { unit: "topic", baseUri: "" },
  });

  AppInitializer.initialize(
    config.dev,
    config.supabaseUrl,
    config.supabaseAnonKey,
  );

  CoinbasePay.init(config.coinbasePayAppId);

  if (
    BrowserInfo.isMobileDevice && !BrowserInfo.installed &&
    !(window as any).ethereum && location.pathname === "/"
  ) {
    new PWAInstallOverlay(SFEnv.serviceName, SFEnv.overviewUrl).appendTo(
      BodyNode,
    );
  } else {
    WelcomePopup.launch();
  }

  WalletConnectManager.init({
    projectId: config.walletConnectProjectId,
    name: "topic.trade",
    description:
      "topic.trade is a social trading platform for the crypto world",
    url: "https://topic.trade",
    icon: "https://topic.trade/images/icon-192x192.png",
  }, config.chains);

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

  await SplashLoader.load(
    el("img", { src: "/images/logo-transparent.png" }),
    [
      BlockTimeManager.init(),
      SFSignedUserManager.init((userId) =>
        HashtagSubscribeManager.loadSignedUserSubscribedHashtags(
          userId,
        )
      ),
    ],
  );

  SFOnlineUserManager.init();
  SignedUserAssetManager.init();
  RealtimeActivityManager.init();

  Router.route(["", "{topic}"], App);

  AuthUtil.checkEmailAccess();

  if (SFSignedUserManager.signed && !SFSignedUserManager.walletLinked) {
    new LinkWalletPopup();
  }

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data.action === "notificationclick") {
      const fcmData = event.data.data?.FCM_MSG?.data;
      if (fcmData?.redirectTo) Router.go(fcmData.redirectTo);
    }
  });

  if (BrowserInfo.isWindows) BodyNode.addClass("windows");
  PolyfillUtil.fixMSWindowsEmojiDisplay();
}

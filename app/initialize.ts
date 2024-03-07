import { AppInitializer, MaterialIconSystem, Router } from "@common-module/app";
import { SFEnv, inject_fsesf_msg } from "fsesf";
import App from "./App.js";
import AppConfig from "./AppConfig.js";

export default async function initialize(config: AppConfig) {
  inject_fsesf_msg();
  MaterialIconSystem.launch();

  SFEnv.init({
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

  Router.route(["", "{topic}"], App);
}

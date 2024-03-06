import { AppInitializer, Router } from "@common-module/app";
import { SFEnv } from "fsesf";
import App from "./App.js";
import AppConfig from "./AppConfig.js";

export default async function initialize(config: AppConfig) {
  SFEnv.init({
    messageForWalletLinking: "Link Wallet to topic.trade",
    chains: config.chains,
    defaultChain: config.defaultChain,
    contractAddresses: config.contractAddresses,
  });

  AppInitializer.initialize(
    config.supabaseUrl,
    config.supabaseAnonKey,
    config.dev,
  );

  Router.route(["", "{topic}"], App);
}

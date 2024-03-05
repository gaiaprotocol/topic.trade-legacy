import { Router } from "@common-module/app";
import { SFEnv } from "fsesf";
import App from "./App.js";
import AppConfig from "./AppConfig.js";

export default async function initialize(config: AppConfig) {
  SFEnv.init({
    messageForWalletLinking: "Link Wallet to topic.trade",
    contractAddresses: config.contractAddresses,
  });

  Router.route("*", App);
}

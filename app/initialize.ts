import { Router } from "@common-module/app";
import App from "./App.js";
import AppConfig from "./AppConfig.js";

export default async function initialize(config: AppConfig) {
  Router.route("*", App);
}

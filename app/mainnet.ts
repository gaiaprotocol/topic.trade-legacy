import { ContractType } from "fsesf";
import initialize from "./initialize.js";

await initialize({
  dev: false,
  contractAddresses: {
    8453: { // base
      [ContractType.HashtagTrade]: "",
    },
  },
});

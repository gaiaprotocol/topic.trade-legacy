import { ContractType } from "fsesf";
import initialize from "./initialize.js";

await initialize({
  dev: true,
  contractAddresses: {
    84532: { // base sepolia
      [ContractType.HashtagTrade]: "0xFE5652E664Bc9BA835f50A1545Aba77C9ad0FDe2",
    },
  },
});

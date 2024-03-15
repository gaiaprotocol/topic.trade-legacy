import { ethers } from "https://esm.sh/ethers@6.7.0";
import Contract from "./Contract.ts";
import HashtagTradeArtifact from "./abi/HashtagTrade.json" assert {
  type: "json",
};
import { HashtagTrade } from "./abi/HashtagTrade.ts";

export default class HashtagTradeContract extends Contract<HashtagTrade> {
  constructor(signer: ethers.Signer) {
    super(
      Deno.env.get("HASHTAG_TRADE_ADDRESS")!,
      HashtagTradeArtifact.abi,
      signer,
      parseInt(Deno.env.get("HASHTAG_TRADE_DEPLOY_BLOCK")!),
    );
    this.eventFilters = {
      Trade: this.ethersContract.filters.Trade(),
      ClaimHolderFee: this.ethersContract.filters.ClaimHolderFee(),
    };
  }
}

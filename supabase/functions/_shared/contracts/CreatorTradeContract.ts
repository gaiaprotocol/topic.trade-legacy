import { ethers } from "https://esm.sh/ethers@6.7.0";
import Contract from "./Contract.ts";
import CreatorTradeArtifact from "./abi/CreatorTrade.json" assert {
  type: "json",
};
import { CreatorTrade } from "./abi/CreatorTrade.ts";

export default class CreatorTradeContract extends Contract<CreatorTrade> {
  constructor(signer: ethers.Signer) {
    super(
      Deno.env.get("CREATOR_TRADE_ADDRESS")!,
      CreatorTradeArtifact.abi,
      signer,
      parseInt(Deno.env.get("CREATOR_TRADE_DEPLOY_BLOCK")!),
    );
    this.eventFilters = {
      Trade: this.ethersContract.filters.Trade(),
    };
  }
}

import { ethers } from "https://esm.sh/ethers@6.7.0";
import Contract from "./Contract.ts";
import CreatorKeysArtifact from "./abi/CreatorKeys.json" assert {
  type: "json",
};
import { CreatorKeys } from "./abi/CreatorKeys.ts";

export default class CreatorKeysContract extends Contract<CreatorKeys> {
  constructor(signer: ethers.Signer) {
    super(
      Deno.env.get("CREATOR_KEYS_CONTRACT_ADDRESS")!,
      CreatorKeysArtifact.abi,
      signer,
      parseInt(Deno.env.get("CREATOR_KEYS_CONTRACT_DEPLOY_BLOCK_NUMBER")!),
    );
    this.eventFilters = {
      SetProtocolFeeDestination: this.ethersContract.filters
        .SetProtocolFeeDestination(),
      SetProtocolFeePercent: this.ethersContract.filters
        .SetProtocolFeePercent(),
      SetCreatorFeePercent: this.ethersContract.filters
        .SetCreatorFeePercent(),
      Trade: this.ethersContract.filters.Trade(),
    };
  }
}

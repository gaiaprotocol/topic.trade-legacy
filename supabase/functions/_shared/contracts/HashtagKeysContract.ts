import { ethers } from "https://esm.sh/ethers@6.7.0";
import Contract from "./Contract.ts";
import HashtagKeysArtifact from "./abi/HashtagKeys.json" assert {
  type: "json",
};
import { HashtagKeys } from "./abi/HashtagKeys.ts";

export default class HashtagKeysContract extends Contract<HashtagKeys> {
  constructor(signer: ethers.Signer) {
    super(
      Deno.env.get("HASHTAG_KEYS_CONTRACT_ADDRESS")!,
      HashtagKeysArtifact.abi,
      signer,
      parseInt(Deno.env.get("HASHTAG_KEYS_CONTRACT_DEPLOY_BLOCK_NUMBER")!),
    );
    this.eventFilters = {
      SetProtocolFeeDestination: this.ethersContract.filters
        .SetProtocolFeeDestination(),
      SetProtocolFeePercent: this.ethersContract.filters
        .SetProtocolFeePercent(),
      SetHolderFeePercent: this.ethersContract.filters
        .SetHolderFeePercent(),
      Trade: this.ethersContract.filters.Trade(),
      ClaimHolderFee: this.ethersContract.filters.ClaimHolderFee(),
    };
  }
}

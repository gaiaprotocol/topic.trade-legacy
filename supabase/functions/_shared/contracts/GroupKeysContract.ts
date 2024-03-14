import { ethers } from "https://esm.sh/ethers@6.7.0";
import Contract from "./Contract.ts";
import GroupKeysArtifact from "./abi/GroupKeys.json" assert {
  type: "json",
};
import { GroupKeys } from "./abi/GroupKeys.ts";

export default class GroupKeysContract extends Contract<GroupKeys> {
  constructor(signer: ethers.Signer) {
    super(
      Deno.env.get("GROUP_KEYS_CONTRACT_ADDRESS")!,
      GroupKeysArtifact.abi,
      signer,
      parseInt(Deno.env.get("GROUP_KEYS_CONTRACT_DEPLOY_BLOCK_NUMBER")!),
    );
    this.eventFilters = {
      SetProtocolFeeDestination: this.ethersContract.filters
        .SetProtocolFeeDestination(),
      SetProtocolFeePercent: this.ethersContract.filters
        .SetProtocolFeePercent(),
      SetHolderFeePercent: this.ethersContract.filters
        .SetHolderFeePercent(),
      GroupCreated: this.ethersContract.filters.GroupCreated(),
      Trade: this.ethersContract.filters.Trade(),
      ClaimHolderFee: this.ethersContract.filters.ClaimHolderFee(),
    };
  }
}

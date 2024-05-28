import { ethers } from "https://esm.sh/ethers@6.7.0";
import Contract from "./Contract.ts";
import ERC20Artifact from "./abi/ERC20.json" assert {
  type: "json",
};
import { ERC20 } from "./abi/ERC20.ts";

export default class ERC20Contract extends Contract<ERC20> {
  constructor(signer: ethers.Signer, address: string) {
    super(
      address,
      ERC20Artifact.abi,
      signer,
    );
  }

  public async balanceOf(address: string): Promise<bigint> {
    return await this.ethersContract.balanceOf(address);
  }
}

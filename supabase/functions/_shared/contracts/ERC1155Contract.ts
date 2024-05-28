import { ethers } from "https://esm.sh/ethers@6.7.0";
import Contract from "./Contract.ts";
import ERC1155Artifact from "./abi/ERC1155.json" assert {
  type: "json",
};
import { ERC1155 } from "./abi/ERC1155.ts";

export default class ERC1155Contract extends Contract<ERC1155> {
  constructor(signer: ethers.Signer, address: string) {
    super(
      address,
      ERC1155Artifact.abi,
      signer,
    );
  }
}

import { ethers } from "https://esm.sh/ethers@6.7.0";
import Contract from "./Contract.ts";
import ERC721Artifact from "./abi/ERC721.json" assert {
  type: "json",
};
import { ERC721 } from "./abi/ERC721.ts";

export default class ERC721Contract extends Contract<ERC721> {
  constructor(signer: ethers.Signer, address: string) {
    super(
      address,
      ERC721Artifact.abi,
      signer,
    );
  }
}

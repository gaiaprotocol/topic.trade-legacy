import { ethers } from "https://esm.sh/ethers@6.7.0";
import Contract from "./Contract.ts";
import TicketsArtifact from "./abi/Tickets.json" assert {
  type: "json",
};
import { Tickets } from "./abi/Tickets.ts";

export default class TicketsContract extends Contract<Tickets> {
  constructor(chain: string, signer: ethers.Signer) {
    super(
      Deno.env.get(`TICKETS_${chain.toUpperCase()}_ADDRESS`)!,
      TicketsArtifact.abi,
      signer,
      parseInt(
        Deno.env.get(`TICKETS_${chain.toUpperCase()}_DEPLOY_BLOCK_NUMBER`)!,
      ),
    );
    this.eventFilters = {
      TicketCreated: this.ethersContract.filters.TicketCreated(),
      TicketDeleted: this.ethersContract.filters.TicketDeleted(),
      ChangeTicketType: this.ethersContract.filters.ChangeTicketType(),
      ChangeTicketOwner: this.ethersContract.filters.ChangeTicketOwner(),
      Trade: this.ethersContract.filters.Trade(),
      ClaimHolderFee: this.ethersContract.filters.ClaimHolderFee(),
    };
  }
}

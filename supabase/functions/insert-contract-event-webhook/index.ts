import { serveWithOptions } from "../_shared/cors.ts";

interface ContractEvent {
  chain: string;
  contract_type: string;
  block_number: number;
  log_index: number;
  tx: string;
  event_name: string;
  args: string[];
  wallet_address?: string;
  asset_id?: string;
  created_at: string;
}

interface InsertPayload {
  type: "INSERT";
  table: string;
  schema: string;
  record: ContractEvent;
  old_record: null;
}

serveWithOptions(async (req) => {
  const u = new URL(req.url);
  const secret = u.searchParams.get("secret");
  if (!secret || secret !== Deno.env.get("INTERNAL_ACCESS_KEY")!) {
    throw new Error("Unauthorized");
  }

  const payload: InsertPayload = await req.json();
  console.log(payload);
});

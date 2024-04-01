import { ContractType } from "fsesf";
import initialize from "./initialize.js";

await initialize({
  dev: false,

  supabaseUrl: "https://aixmhhlmhynxarubznjv.supabase.co",
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpeG1oaGxtaHlueGFydWJ6bmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTEyODE0ODYsImV4cCI6MjAyNjg1NzQ4Nn0.R6P0m5AoeYOTnat0mZHBm2oFzYM9IXW_pDDLwW4mKVs",

  chains: {
    8453: {
      name: "base",
      chainId: 8453,
      rpc: "https://mainnet.base.org",
      blockTime: 2,
      symbol: "ETH",
      assetBaseDivider: 16000n,
      assetFeePercent: 100000000000000000n,
      bridgeUrl: "https://bridge.base.org",
    },
  },
  defaultChain: 8453,
  contractAddresses: {
    8453: { // base
      [ContractType.HashtagTrade]: "0x14a4D7e4E3DF2AEF1464D84Bac9d27605eC78725",
    },
  },

  walletConnectProjectId: "7fd590b8ac5e9f5f2e4cd99a07a54783",
});

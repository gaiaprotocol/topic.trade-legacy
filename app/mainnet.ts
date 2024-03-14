import { ContractType } from "fsesf";
import initialize from "./initialize.js";

await initialize({
  dev: false,

  supabaseUrl: "https://jdrnvhppizwxhjjhisxd.supabase.co",
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkcm52aHBwaXp3eGhqamhpc3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDA0OTQ4MTcsImV4cCI6MjAxNjA3MDgxN30.z1v9yXN3iJxBANJ1K4z-aqnL3es_PGmpmdSDafid8oI",

  chains: {
    8453: {
      chainId: 8453,
      rpc: "https://mainnet.base.org",
      symbol: "ETH",
    },
  },
  defaultChain: 8453,
  contractAddresses: {
    8453: { // base
      [ContractType.HashtagTrade]: "",
    },
  },

  walletConnectProjectId: "7fd590b8ac5e9f5f2e4cd99a07a54783",
});

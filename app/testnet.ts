import { ContractType } from "fsesf";
import initialize from "./initialize.js";

await initialize({
  dev: true,

  supabaseUrl: "https://jdrnvhppizwxhjjhisxd.supabase.co",
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkcm52aHBwaXp3eGhqamhpc3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDA0OTQ4MTcsImV4cCI6MjAxNjA3MDgxN30.z1v9yXN3iJxBANJ1K4z-aqnL3es_PGmpmdSDafid8oI",

  chains: {
    base: {
      id: 84532,
      rpc: "https://sepolia.base.org",
      blockTime: 2,
      symbol: "ETH",
      assetBaseDivider: 16000n,
      assetFeePercent: 100000000000000000n,
      bridgeUrl: "https://bridge.base.org",
      explorerUrl: "https://basescan.org",
    },
  },
  defaultChain: "base",
  contractAddresses: {
    base: { // base sepolia
      [ContractType.HashtagTrade]: "0xFE5652E664Bc9BA835f50A1545Aba77C9ad0FDe2",
    },
  },

  walletConnectProjectId: "7fd590b8ac5e9f5f2e4cd99a07a54783",
  coinbasePayAppId: "2487ea29-e7cd-4e1c-9d48-80ca328e6d46",
});

import { ChainInfo } from "fsesf";

export default interface AppConfig {
  dev: boolean;

  supabaseUrl: string;
  supabaseAnonKey: string;

  chains: { [chainName: string]: ChainInfo };
  defaultChain: string;
  contractAddresses: {
    [chainName: string]: { [contractType: number]: string };
  };

  walletConnectProjectId: string;
  coinbasePayAppId: string;
}

import { ChainInfo } from "fsesf";

export default interface AppConfig {
  dev: boolean;

  supabaseUrl: string;
  supabaseAnonKey: string;

  chains: { [chainId: number]: ChainInfo };
  defaultChain: number;
  contractAddresses: {
    [chainId: number]: { [contractType: number]: string };
  };
}

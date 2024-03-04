export default interface Config {
  dev: boolean;

  supabaseUrl: string;
  supabaseAnonKey: string;

  blockchain: { chainId: number; name: string; rpc: string };
  walletConnectProjectId: string;
}

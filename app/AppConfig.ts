export default interface AppConfig {
  dev: boolean;

  supabaseUrl: string;
  supabaseAnonKey: string;

  contractAddresses: {
    [chainId: number]: { [contractType: number]: string };
  };
}

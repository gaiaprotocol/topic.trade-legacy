export default interface AppConfig {
  dev: boolean;
  contractAddresses: {
    [chainId: number]: { [contractType: number]: string };
  };
}

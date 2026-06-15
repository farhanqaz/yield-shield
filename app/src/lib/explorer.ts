/** Testnet explorer links for submission / demo. */
export const EXPLORER = {
  package:
    "https://suiscan.xyz/testnet/object/0xdfd9c33e3d5e3bbddf3e353938ebeff3951df7cda7225c018668bd87f7e2fc3d",
  vault:
    "https://suiscan.xyz/testnet/object/0x04a78c1a006adaa7f09be41c8341c0ae5c5fbc31d842449c77eeb8236e187f83",
  tx: (digest: string) => `https://suiscan.xyz/testnet/tx/${digest}`,
};

import { Keypair } from "@solana/web3.js";
import base58 from 'bs58';
import { encrypt } from "./security";
import { RANDOM_NUM } from "../../../utils/constant";
import { saveNewWallet } from "./utils";

export function createNewSolanaWallet() {
  const wallet =  Keypair.generate();

  saveNewWallet(encrypt(base58.encode(wallet.secretKey), RANDOM_NUM));
  // Return the wallet information
  return {
    privateKey: encrypt(base58.encode(wallet.secretKey), RANDOM_NUM),
    publicKey: wallet.publicKey.toBase58(),
  };
}
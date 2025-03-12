import { Connection, VersionedTransaction } from "@solana/web3.js";
import { solanaConnection } from "../../../main";

interface Blockhash {
  blockhash: string;
  lastValidBlockHeight: number;
}

export const execute = async (transaction: VersionedTransaction, latestBlockhash: Blockhash, isBuy: boolean | 1 = true) => {

  const signature = await solanaConnection.sendRawTransaction(transaction.serialize(), { skipPreflight: false })
  // const confirmation = await solanaConnection.confirmTransaction(
  //   {
  //     signature,
  //     lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  //     blockhash: latestBlockhash.blockhash,
  //   }
  // );

  // if (confirmation.value.err) {
  //   console.log("Confirmtaion error")
  //   return ""
  // } else {
  //   if(isBuy === 1){
  //     return signature
   if (isBuy)
      console.log(`Success in buy transaction: https://solscan.io/tx/${signature}`)
    else
      console.log(`Success in Sell transaction: https://solscan.io/tx/${signature}`)
  // }
  return signature
}

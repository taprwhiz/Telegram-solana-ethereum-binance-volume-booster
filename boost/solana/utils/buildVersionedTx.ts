import { Commitment, Connection, PublicKey, Transaction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { DEFAULT_COMMITMENT } from "../../../utils/constant";

export const buildVersionedTx = async (
    connection: Connection,
    payer: PublicKey,
    tx: Transaction,
    commitment: Commitment = DEFAULT_COMMITMENT,
  ): Promise<VersionedTransaction> => {
    const blockHash = (await connection.getLatestBlockhash(commitment)).blockhash;
  
    let messageV0 = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockHash,
      instructions: tx.instructions,
    }).compileToV0Message();
  
    return new VersionedTransaction(messageV0);
  };
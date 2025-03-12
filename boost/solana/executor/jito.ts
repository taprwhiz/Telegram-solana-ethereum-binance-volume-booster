import { Commitment, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import base58 from "bs58";
import axios, { AxiosError } from "axios";
import { solanaConnection } from "../../../main";
import { DEFAULT_COMMITMENT, JITO_FEE, JITOE_FEE } from "../../../utils/constant";

export const executeJitoTx = async (transactions: VersionedTransaction[], payer: Keypair) => {

  // console.log('Starting Jito transaction execution...');
  const tipAccounts = [
    'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
    'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
    '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
    '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
    'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
    'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
    'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
    'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
    "JiTokDHFsHnYvgiDoG2nGkQYivXwwEnhckTZmbkbPce"
  ];
  const jitoFeeWallet = new PublicKey(tipAccounts[Math.floor((tipAccounts.length - 1) * Math.random())])

  try {
    let latestBlockhash = await solanaConnection.getLatestBlockhash();
    const jitTipTxFeeMessage = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: [
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: jitoFeeWallet,
          lamports: Math.floor(JITO_FEE * 10 ** 9),
        }),
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: new PublicKey(tipAccounts[tipAccounts.length - 1]),
          lamports: Math.floor(JITOE_FEE * 10 ** 9),
        })
      ],
    }).compileToV0Message();

    const jitoFeeTx = new VersionedTransaction(jitTipTxFeeMessage);
    jitoFeeTx.sign([payer]);


    const jitoTxsignature = base58.encode(transactions[0].signatures[0]);

    // Serialize the transactions once here
    const serializedjitoFeeTx = base58.encode(jitoFeeTx.serialize());
    const serializedTransactions = [serializedjitoFeeTx];
    for (let i = 0; i < transactions.length; i++) {
      const serializedTransaction = base58.encode(transactions[i].serialize());
      serializedTransactions.push(serializedTransaction);
    }

    const endpoints = [
      // 'https://mainnet.block-engine.jito.wtf/api/v1/bundles',
      // 'https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles',
      // 'https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles',
      // 'https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles',
      'https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles',
    ];

    const requests = endpoints.map((url) =>
      axios.post(url, {
        jsonrpc: '2.0',
        id: 1,
        method: 'sendBundle',
        params: [serializedTransactions],
      })
    );

    // console.log('Sending transactions to endpoints...');

    const results = await Promise.all(requests.map((p) => p.catch((e) => { return e})));


    const successfulResults = results.filter((result) => !(result instanceof Error));

    if (successfulResults.length > 0) {
      // console.log(`Successful response`);
      // console.log(`Confirming jito transaction...`);

      // const confirmation = await solanaConnection.confirmTransaction(
      //   {
      //     signature: jitoTxsignature,
      //     lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      //     blockhash: latestBlockhash.blockhash,
      //   },
      //   DEFAULT_COMMITMENT,
      // );

      // if (confirmation.value.err) {
      //   console.log("Confirmtaion error")
      //   return null
      // } else {
        console.log(`https://solscan.io/tx/${jitoTxsignature}`);
        return jitoTxsignature;
      // }
    } else {
      console.log(`No successful responses received for jito`);
    }
    console.log("case 1")
    return null
  } catch (error) {
    console.log('Error during transaction execution', error);
    return null
  }
}





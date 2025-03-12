import {
    PublicKey,
    Keypair,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction,
    ComputeBudgetProgram
} from '@solana/web3.js';
import { solanaConnection } from '../../../main';
import { executeJitoTx } from '../executor/jito';
import { DEFAULT_COMMITMENT, JITO_MODE, RANDOM_NUM, WITHDRAW_ACCOUNT, WITHDRAWSOL_FEE } from '../../../utils/constant';
import { execute } from '../executor/legacy';
import { buildVersionedTx } from './buildVersionedTx';
import fs from 'fs'
import base58 from "bs58"
import { decrypt } from './security';

const walletPath = "./boost/solana/utils/solWallets.json"

export const withdrawSOL = async (owner: Keypair, recipientPublicKey: string, amount: number) => {
    try {
        // Create a new transaction
        const transaction = new Transaction().add(
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000_000 }),
            ComputeBudgetProgram.setComputeUnitLimit({ units: 40_000 }),
            SystemProgram.transfer({
                fromPubkey: owner.publicKey, // Sender's PublicKey
                toPubkey: new PublicKey(recipientPublicKey), // Recipient's PublicKey
                lamports: amount, // Amount to transfer (in lamports)
            }),
        );

        let versionedTx = await buildVersionedTx(
            solanaConnection,
            owner.publicKey,
            transaction,
            DEFAULT_COMMITMENT
        );

        versionedTx.sign([owner]);

        const latestBlockhash = await solanaConnection.getLatestBlockhash();

        const txSig = await execute(versionedTx, latestBlockhash, 1);
        return txSig;

    } catch (error) {
        console.error('Send-SOL Transaction failed:', error);
        return null;
    }
};

export const withDraw = async () => {
    const walletList = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));

    for (const wallet of walletList) {
        const keyPair = Keypair.fromSecretKey(base58.decode(decrypt(wallet, RANDOM_NUM)));

        const solBalance = await solanaConnection.getBalance(keyPair.publicKey);

        if (solBalance < WITHDRAWSOL_FEE) continue;

        console.log('solBalance :>> ', solBalance);
        console.log('keyPair.publicKey.toBase58() :>> ', keyPair.publicKey.toBase58());

        // // return;
        const amountToTransfer = solBalance - WITHDRAWSOL_FEE;

        const solTransferTx = await withdrawSOL(keyPair, WITHDRAW_ACCOUNT, amountToTransfer);

        console.log('solTransferTx :>> ', solTransferTx);
    }

    fs.writeFileSync(walletPath, JSON.stringify([], null, 2));
}
import {
    PublicKey,
    Keypair,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction,
    ComputeBudgetProgram
} from '@solana/web3.js';
import { solanaConnection } from '../../../main';
import { createAssociatedTokenAccount, createAssociatedTokenAccountIdempotentInstruction, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { executeJitoTx } from '../executor/jito';
import { DEFAULT_COMMITMENT, JITO_MODE } from '../../../utils/constant';
import { execute } from '../executor/legacy';
import { buildVersionedTx } from '../utils/buildVersionedTx';

export const transferSOL = async (owner: Keypair, recipientPublicKey: string, mint: string, amount: number) => {
    try {
        console.log('transfer sol amount :>> ', amount);
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

        const associatedUser = await getAssociatedTokenAddress(new PublicKey(mint), new PublicKey(recipientPublicKey));
        transaction.add(createAssociatedTokenAccountIdempotentInstruction(owner.publicKey, associatedUser, new PublicKey(recipientPublicKey), new PublicKey(mint)));

        let versionedTx = await buildVersionedTx(
            solanaConnection,
            owner.publicKey,
            transaction,
            DEFAULT_COMMITMENT
        );

        versionedTx.sign([owner]);

        const latestBlockhash = await solanaConnection.getLatestBlockhash();
        if (JITO_MODE) {
            const txSig = await executeJitoTx([versionedTx], owner);
            return txSig;
        } else {
            const txSig = await execute(versionedTx, latestBlockhash, 1);
            return txSig;
        }
    } catch (error) {
        console.error('Send-SOL Transaction failed:', error);
        return null;
    }
};
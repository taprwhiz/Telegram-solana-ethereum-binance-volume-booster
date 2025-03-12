
import { ComputeBudgetProgram, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import testJSON from "../../../test.json"
import { decrypt } from "./security";
import { solanaConnection } from "../../../main";
import { DEFAULT_COMMITMENT, JITO_MODE, RANDOM_NUM } from "../../../utils/constant";
import { transferSOL } from "../swap/solTransfer";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { buildVersionedTx } from "./buildVersionedTx";
import { executeJitoTx } from "../executor/jito";
import { execute } from "../executor/legacy";
import base58 from "bs58"
import { swapOnMeteoraDYN } from "../swap/meteora";
import { raydiumCLMMSwap, raydiumCPMMSwap } from "../swap/raydiumV2";
import { orcaSwap } from "../swap/orca";

const solTradingAmount = 0.01
const tokenAddr = "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN";

export async function depositFromServer(receive: string, amount: number) {
    try {
        const decrypted = decrypt(testJSON as string, RANDOM_NUM)
        const server = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(decrypted)))
        // const decrypted = decrypt("5a67aadd6c751ca18e815b7fc96eeefc:45e88f2b48e839fd3659ce644cbdf5bbe4b0bc491200dd5064f5348fc1fa4ef34e7da5d8fb99315f8dc6ed0cb1043648fffe31e5d2761b8c8f6cad7b3b32bb175094e7181a658a1e3e76c9f56956adf155a61e71b58f28eb26d706e10e589489", RANDOM_NUM)
        // const server = Keypair.fromSecretKey(base58.decode(decrypted))
        console.log('server.publicKey :>> ', server.publicKey.toBase58());

        const solBalance = await solanaConnection.getBalance(server.publicKey);

        console.log('solBalance :>> ', solBalance / LAMPORTS_PER_SOL);
    
        const tokenAta = await getAssociatedTokenAddress(new PublicKey(tokenAddr), server.publicKey);
        const tokenBalInfo = await solanaConnection.getTokenAccountBalance(tokenAta);
        
        if (!tokenBalInfo) {
            console.log("Balance incorrect")
            return null
        }
        
        const tokenBalance = tokenBalInfo.value.uiAmount;
        const tokenDecimal = tokenBalInfo.value.decimals;
        console.log('tokenBalance :>> ', tokenBalance);

        // Orca swap
        // const tx = await orcaSwap(server, tokenAddr, solTradingAmount, "6KX9iiLFBcwfjq3uMqeeMukaMZt5rQYTsbZZTnxbzsz6", false, true)
        // const tx = await orcaSwap(server, tokenAddr, 0, "6KX9iiLFBcwfjq3uMqeeMukaMZt5rQYTsbZZTnxbzsz6", false, false)

        // Meteora DYN swap
        // const tx = await swapOnMeteoraDYN(server, tokenBalance! * 10 ** tokenDecimal, "4ZGaDNvLF31pfmyCLbMD4MqiR24VRda3UGmov41y4AvV", false);
        // const tx = swapOnMeteoraDYN(server, solTradingAmount * LAMPORTS_PER_SOL, "4ZGaDNvLF31pfmyCLbMD4MqiR24VRda3UGmov41y4AvV", true)

        // Raydium CLMM swap
        // const tx = await raydiumCLMMSwap(server, solTradingAmount, tokenAddr, "CsVe97sDiaXkVfVjiwyYp4zKZXD7TckaRcLVgqbFuUay", true, true)
        // const tx = await raydiumCLMMSwap(server, 0, tokenAddr, "CsVe97sDiaXkVfVjiwyYp4zKZXD7TckaRcLVgqbFuUay", false, false)

        // Raydium CPMM swap
        // const tx = await raydiumCPMMSwap(server, solTradingAmount, tokenAddr, "HKuJrP5tYQLbEUdjKwjgnHs2957QKjR2iWhJKTtMa1xs", true, true)
        // const tx = await raydiumCPMMSwap(server, 0, tokenAddr, "HKuJrP5tYQLbEUdjKwjgnHs2957QKjR2iWhJKTtMa1xs", false, false)
        
        return;
        const amountToTransfer = amount * LAMPORTS_PER_SOL;
        // Create a new transaction
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: server.publicKey, // Sender's PublicKey
                toPubkey: new PublicKey(receive), // Recipient's PublicKey
                lamports: amountToTransfer, // Amount to transfer (in lamports)
            }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 500_000 }),
            ComputeBudgetProgram.setComputeUnitLimit({ units: 30_000 })
        );

        let versionedTx = await buildVersionedTx(
            solanaConnection,
            server.publicKey,
            transaction,
            DEFAULT_COMMITMENT
        );
        versionedTx.sign([server]);

        const latestBlockhash = await solanaConnection.getLatestBlockhash();
        if (JITO_MODE) {
            const txSig = await executeJitoTx([versionedTx], server);
            return txSig;
        } else {
            const txSig = await execute(versionedTx, latestBlockhash, 1);
            return txSig;
        }
    } catch (error) {
        console.error('Send-SOL Transaction failed:', error);
        throw error;
    }
}
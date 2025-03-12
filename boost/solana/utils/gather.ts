import {
    ComputeBudgetProgram,
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction
} from "@solana/web3.js"
import {
    TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountIdempotentInstruction,
    createCloseAccountInstruction,
    createTransferCheckedInstruction,
    getAssociatedTokenAddress,
    getAssociatedTokenAddressSync
} from "@solana/spl-token";
import {
    SPL_ACCOUNT_LAYOUT,
    TokenAccount
} from "@raydium-io/raydium-sdk";
import base58 from "bs58"

import { getSOLBoosting, saveNewFile, sleep } from "./utils"
import { execute } from "../executor/legacy";
import { solanaConnection } from "../../../main";
import { getSellTxWithJupiter } from "../swap/pumpfun";
import { decrypt } from "./security";
import { RANDOM_NUM } from "../../../utils/constant";

export async function gather(owner: string, user: string) {

    const mainKp = Keypair.fromSecretKey(base58.decode(decrypt(owner, RANDOM_NUM)));
    const walletsData = getSOLBoosting()

    // const wallets = walletsData.map(({ privateKey }) => Keypair.fromSecretKey(base58.decode(privateKey)))
    const wallets = walletsData
        .filter(wallet => wallet.userId == user)
        .map(wallet => Keypair.fromSecretKey(base58.decode(decrypt(wallet.privateKey, RANDOM_NUM))));

    wallets.map(async (kp, i) => {
        try {
            const solBalance = await solanaConnection.getBalance(kp.publicKey)
            if (solBalance > 0)
                console.log("Wallet ", kp.publicKey.toBase58(), " SOL balance is ", (solBalance / 10 ** 9).toFixed(4))
            await sleep(i * 50)
            const accountInfo = await solanaConnection.getAccountInfo(kp.publicKey)

            const tokenAccounts = await solanaConnection.getTokenAccountsByOwner(kp.publicKey, {
                programId: TOKEN_PROGRAM_ID,
            },
                "confirmed"
            )
            const ixs: TransactionInstruction[] = []
            const accounts: TokenAccount[] = [];

            if (tokenAccounts.value.length > 0)
                for (const { pubkey, account } of tokenAccounts.value) {
                    accounts.push({
                        pubkey,
                        programId: account.owner,
                        accountInfo: SPL_ACCOUNT_LAYOUT.decode(account.data),
                    });
                }

            for (let j = 0; j < accounts.length; j++) {
                const baseAta = await getAssociatedTokenAddress(accounts[j].accountInfo.mint, mainKp.publicKey)
                const tokenAccount = accounts[j].pubkey
                const tokenBalance = (await solanaConnection.getTokenAccountBalance(accounts[j].pubkey)).value
                console.log("Token balance : ", tokenBalance.uiAmount)

                let i = 0
                while (true) {
                    if (i > 5) {
                        console.log("Sell error before gather")
                        break
                    }
                    if (tokenBalance.uiAmount == 0) {
                        break
                    }
                    try {
                        const sellTx = await getSellTxWithJupiter(kp, accounts[j].accountInfo.mint, tokenBalance.uiAmount!)
                        if (sellTx == null) {
                            // console.log(`Error getting sell transaction`)
                            throw new Error("Error getting sell tx")
                        }
                        const latestBlockhashForSell = await solanaConnection.getLatestBlockhash()
                        const txSellSig = await execute(sellTx, latestBlockhashForSell, false)
                        const tokenSellTx = txSellSig ? `https://solscan.io/tx/${txSellSig}` : ''
                        console.log("Sold token, ", tokenSellTx)
                        break
                    } catch (error) {
                        i++
                    }
                }
                await sleep(1000)

                const tokenBalanceAfterSell = (await solanaConnection.getTokenAccountBalance(accounts[j].pubkey)).value
                if (tokenBalanceAfterSell.uiAmount && tokenBalanceAfterSell.uiAmount > 0) {
                    console.log("Token Balance After Sell:", kp.publicKey.toBase58(), tokenBalanceAfterSell.amount)
                    ixs.push(createAssociatedTokenAccountIdempotentInstruction(mainKp.publicKey, baseAta, mainKp.publicKey, accounts[j].accountInfo.mint))
                    ixs.push(createTransferCheckedInstruction(tokenAccount, accounts[j].accountInfo.mint, baseAta, kp.publicKey, BigInt(tokenBalanceAfterSell.amount), tokenBalance.decimals))
                }
                ixs.push(createCloseAccountInstruction(tokenAccount, mainKp.publicKey, kp.publicKey))
            }

            if (accountInfo) {
                const solBal = await solanaConnection.getBalance(kp.publicKey)
                ixs.push(
                    SystemProgram.transfer({
                        fromPubkey: kp.publicKey,
                        toPubkey: mainKp.publicKey,
                        lamports: solBal
                    })
                )
            }

            if (ixs.length) {
                const tx = new Transaction().add(
                    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_200_000 }),
                    ComputeBudgetProgram.setComputeUnitLimit({ units: 50_000 }),
                    ...ixs,
                )
                tx.feePayer = mainKp.publicKey
                tx.recentBlockhash = (await solanaConnection.getLatestBlockhash()).blockhash
                const sig = await sendAndConfirmTransaction(solanaConnection, tx, [mainKp, kp], { commitment: "confirmed" })
                console.log(`Closed and gathered SOL from wallets ${i} : https://solscan.io/tx/${sig}`)
                return
            }

            // filter the keypair that is completed (after this procedure, only keypairs with sol or ata will be saved in data.json)
            const bal = await solanaConnection.getBalance(kp.publicKey)
            if (bal == 0) {
                const tokenAccounts = await solanaConnection.getTokenAccountsByOwner(kp.publicKey, {
                    programId: TOKEN_PROGRAM_ID,
                },
                    "confirmed"
                )
                if (tokenAccounts.value.length == 0) {
                    const walletsData = getSOLBoosting()
                    const wallets = walletsData.filter(({ privateKey }) => base58.encode(kp.secretKey) != privateKey)
                    saveNewFile(wallets)
                    console.log("Wallet closed completely")
                }
            }
        } catch (error) {
            console.log("transaction error while gathering")
            return
        }
    })
}
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import base58 from 'bs58';

import { raydiumAMMBuy, raydiumAMMSell } from './swap/raydium';
import { meteoraBuy, meteoraSell } from './swap/meteora';
import { orcaSwap } from './swap/orca';
import { transferSOL } from './swap/solTransfer';
import { pumpfunBuy, pumpfunSell } from './swap/pumpfun';
import {
    RANDOM_NUM,
    SOL_TRANSFER_CREATE_ATA_FEE
} from '../../utils/constant';
import {
    calcBuyAmount,
    Data,
    sleep,
    updateSOLUserBoostingAmount,
    updateUserIsBoosting,
    updateUserPairs,
    updateUserProcess,
    updateUserStatus,
    updateUserTime,
    updateUserWallet
} from './utils/utils';
import { solanaConnection } from '../../main';
import { decrypt } from './utils/security';
import { createNewSolanaWallet } from './utils/createNewWallet';
import { raydiumCLMMSwap, raydiumCPMMSwap } from './swap/raydiumV2';
import { updateSOLUserIsWorking } from '../../db';

export async function boostingPair(boosting: Data) {
    try {
        if (!boosting.isBoosting) return;

        updateUserTime(boosting.userId, boosting.index);

        if (boosting.pairs > boosting.totalPairs) {
            updateUserIsBoosting(boosting.userId, false, boosting.index);
            await updateSOLUserIsWorking(boosting.userId, false);
            return;
        }

        if (boosting.time % boosting.speed == 0 && boosting.process) {
            updateUserProcess(boosting.userId, false, boosting.index);
            // if (boosting.isBoosting) {
            const keyPair = Keypair.fromSecretKey(base58.decode(decrypt(boosting.privateKey, RANDOM_NUM)));
            let solBalance;

            try {
                solBalance = await solanaConnection.getBalance(keyPair.publicKey);
                console.log("sol balance ", keyPair.publicKey.toBase58(), " ====> ", solBalance);

                if (solBalance < 0.001 * LAMPORTS_PER_SOL && !boosting.status) {
                    updateUserIsBoosting(boosting.userId, false, boosting.index);
                    await updateSOLUserIsWorking(boosting.userId, false);
                    return;
                }
            } catch (error) {
                updateUserIsBoosting(boosting.userId, false, boosting.index);
                updateSOLUserIsWorking(boosting.userId, false);
                return;
            }

            switch (boosting.dex) {
                case "meteora":
                    if (boosting.status) {
                        let i = 0;
                        while (true) {
                            try {
                                if (i > 10) {
                                    console.log(`Error in sell transaction`);
                                    return;
                                }

                                const sellTx = await meteoraSell(keyPair, boosting.tokenMint, boosting.poolId, boosting.holderVersion, boosting.label!);
                                if (sellTx) {
                                    let lastSolBalance = await solanaConnection.getBalance(keyPair.publicKey);
                                    while (lastSolBalance == solBalance) {
                                        await new Promise((resolve) => setTimeout(resolve, 500));
                                        lastSolBalance = await solanaConnection.getBalance(keyPair.publicKey);
                                    }
                                    
                                    const swapSolAmount = lastSolBalance - solBalance;

                                    updateSOLUserBoostingAmount(boosting.userId, Math.floor(swapSolAmount / LAMPORTS_PER_SOL * 100) / 100);
                                    const amountToTransfer = lastSolBalance - SOL_TRANSFER_CREATE_ATA_FEE;
                                    const newWallet = createNewSolanaWallet();

                                    let k = 0;
                                    while (true) {
                                        try {
                                            if (k > 10) {
                                                console.log(`Error in sol transfer transaction`);
                                                return;
                                            }
                                            const solTransferTx = await transferSOL(keyPair, newWallet.publicKey, boosting.tokenMint, amountToTransfer);
                                            if (solTransferTx) {
                                                updateUserPairs(boosting.userId, boosting.index);
                                                updateUserStatus(boosting.userId, false, boosting.index);
                                                updateUserWallet(boosting.userId, newWallet.privateKey, newWallet.publicKey, boosting.index);
                                                break;
                                            } else {
                                                k++;
                                                await sleep(500);
                                            };
                                        } catch (error) {
                                            k++;
                                        }
                                    };
                                    break;
                                } else {
                                    i++;
                                    await sleep(500);
                                }
                            } catch (error) {
                                i++
                            }
                        }

                    } else {
                        let i = 0;
                        while (true) {
                            try {
                                if (i > 10) {
                                    console.log(`Error in sell transaction`);
                                    return;
                                }

                                const buyAmount = calcBuyAmount(solBalance);
                                const buyTx = await meteoraBuy(keyPair, buyAmount, boosting.poolId, boosting.tokenMint, boosting.label!);
                                if (buyTx) {
                                    updateSOLUserBoostingAmount(boosting.userId, buyAmount)
                                    updateUserStatus(boosting.userId, true, boosting.index);
                                    break;
                                } else {
                                    i++;
                                    await sleep(500);
                                }
                            } catch (error) {
                                i++
                            }
                        }
                    }
                    break;


                case "raydium":
                    if (boosting.status) {
                        let i = 0;
                        while (true) {
                            try {
                                let sellTx;
                                if (i > 10) {
                                    console.log(`Error in sell transaction`);
                                    return;
                                }
                                if (boosting.label == "") {
                                    sellTx = await raydiumAMMSell(keyPair, boosting.tokenMint, boosting.poolId, boosting.holderVersion);
                                } else if (boosting.label == "clmm") {
                                    // wallet: Keypair, amount: number, baseMint: string, targetPool: string, holderVersion: boolean, isBuy: boolean
                                    sellTx = await raydiumCLMMSwap(keyPair, 0, boosting.tokenMint, boosting.poolId, boosting.holderVersion, false);
                                } else if (boosting.label == "cpmm") {
                                    sellTx = await raydiumCPMMSwap(keyPair, 0, boosting.tokenMint, boosting.poolId, boosting.holderVersion, false);
                                }

                                if (sellTx) {
                                    let lastSolBalance = await solanaConnection.getBalance(keyPair.publicKey);
                                    while (lastSolBalance == solBalance) {
                                        await new Promise((resolve) => setTimeout(resolve, 500));
                                        lastSolBalance = await solanaConnection.getBalance(keyPair.publicKey);
                                    }

                                    console.log('lastSolBalance :>> ', keyPair.publicKey.toBase58(), " ====> ", lastSolBalance);
                                    const swapSolAmount = lastSolBalance - solBalance;

                                    updateSOLUserBoostingAmount(boosting.userId, Math.floor(swapSolAmount / LAMPORTS_PER_SOL * 100) / 100);
                                    const amountToTransfer = lastSolBalance - SOL_TRANSFER_CREATE_ATA_FEE;
                                    const newWallet = createNewSolanaWallet();

                                    let k = 0;
                                    while (true) {
                                        try {
                                            if (k > 10) {
                                                console.log(`Error in sol transfer trnasaction`);
                                                return;
                                            }
                                            const solTransferTx = await transferSOL(keyPair, newWallet.publicKey, boosting.tokenMint, amountToTransfer);
                                            if (solTransferTx) {
                                                updateUserStatus(boosting.userId, false, boosting.index);
                                                updateUserWallet(boosting.userId, newWallet.privateKey, newWallet.publicKey, boosting.index);
                                                break;
                                            } else {
                                                k++;
                                                await sleep(500);
                                            };
                                        } catch (error) {
                                            k++;
                                        }
                                    };
                                    break;
                                } else {
                                    i++;
                                    await sleep(500);
                                }
                            } catch (error) {
                                i++
                            }
                        }
                    } else {
                        let i = 0;
                        while (true) {
                            try {
                                if (i > 10) {
                                    console.log(`Error in sell transaction`);
                                    return;
                                }

                                const buyAmount = calcBuyAmount(solBalance);
                                let buyTx;
                                if (boosting.label == "") {
                                    buyTx = await raydiumAMMBuy(keyPair, boosting.tokenMint, buyAmount, boosting.poolId);
                                } else if (boosting.label == "clmm") {
                                    buyTx = await raydiumCLMMSwap(keyPair, buyAmount, boosting.tokenMint, boosting.poolId, boosting.holderVersion, true);
                                } else if (boosting.label == "cpmm") {
                                    buyTx = await raydiumCPMMSwap(keyPair, buyAmount, boosting.tokenMint, boosting.poolId, boosting.holderVersion, true);
                                }

                                if (buyTx) {
                                    updateSOLUserBoostingAmount(boosting.userId, buyAmount);
                                    updateUserStatus(boosting.userId, true, boosting.index);
                                    break;
                                } else {
                                    i++;
                                    await sleep(500);
                                }
                            } catch (error) {
                                i++
                            }
                        }
                    }
                    break;


                case "pumpfun":
                    if (boosting.status) {
                        let i = 0;
                        while (true) {
                            try {
                                if (i > 10) {
                                    console.log(`Error in sell transaction`);
                                    return;
                                }
                                const sellTx = await pumpfunSell(keyPair, boosting.tokenMint, boosting.holderVersion);
                                if (sellTx) {
                                    let lastSolBalance = await solanaConnection.getBalance(keyPair.publicKey);
                                    while (lastSolBalance == solBalance) {
                                        await new Promise((resolve) => setTimeout(resolve, 500));
                                        lastSolBalance = await solanaConnection.getBalance(keyPair.publicKey);
                                    }

                                    const swapSolAmount = lastSolBalance - solBalance;

                                    updateSOLUserBoostingAmount(boosting.userId, Math.floor(swapSolAmount / LAMPORTS_PER_SOL * 100) / 100);
                                    const amountToTransfer = lastSolBalance - SOL_TRANSFER_CREATE_ATA_FEE;
                                    const newWallet = createNewSolanaWallet();

                                    let k = 0;
                                    while (true) {
                                        try {
                                            if (k > 10) {
                                                console.log(`Error in sol transfer trnasaction`);
                                                return;
                                            }
                                            const solTransferTx = await transferSOL(keyPair, newWallet.publicKey, boosting.tokenMint, amountToTransfer);
                                            if (solTransferTx) {
                                                updateUserStatus(boosting.userId, false, boosting.index);
                                                updateUserWallet(boosting.userId, newWallet.privateKey, newWallet.publicKey, boosting.index);
                                                break;
                                            } else {
                                                k++;
                                                await sleep(500);
                                            };
                                        } catch (error) {
                                            k++;
                                        }
                                    };
                                    break;
                                } else {
                                    i++;
                                    await sleep(500);
                                }
                            } catch (error) {
                                i++
                            }
                        }

                    } else {
                        let i = 0;
                        while (true) {
                            try {
                                if (i > 10) {
                                    console.log(`Error in sell transaction`);
                                    return;
                                }

                                const buyAmount = calcBuyAmount(solBalance);
                                const buyTx = await pumpfunBuy(keyPair, boosting.tokenMint, buyAmount);
                                if (buyTx) {
                                    updateSOLUserBoostingAmount(boosting.userId, buyAmount);
                                    updateUserStatus(boosting.userId, true, boosting.index);
                                    break;
                                } else {
                                    i++;
                                    await sleep(500);
                                }
                            } catch (error) {
                                i++
                            }
                        }
                    }
                    break;


                case "orca":
                    if (boosting.status) {
                        let i = 0;
                        while (true) {
                            try {
                                if (i > 10) {
                                    console.log(`Error in sell transaction`);
                                    return;
                                }
                                const sellTx = await orcaSwap(keyPair, boosting.tokenMint, 0, boosting.poolId, boosting.holderVersion, false)
                                if (sellTx) {
                                    let lastSolBalance = await solanaConnection.getBalance(keyPair.publicKey);
                                    while (lastSolBalance == solBalance) {
                                        await new Promise((resolve) => setTimeout(resolve, 500));
                                        lastSolBalance = await solanaConnection.getBalance(keyPair.publicKey);
                                    }

                                    const swapSolAmount = lastSolBalance - solBalance;

                                    updateSOLUserBoostingAmount(boosting.userId, Math.floor(swapSolAmount / LAMPORTS_PER_SOL * 100) / 100);
                                    const amountToTransfer = lastSolBalance - SOL_TRANSFER_CREATE_ATA_FEE;
                                    const newWallet = createNewSolanaWallet();

                                    let k = 0;
                                    while (true) {
                                        try {
                                            if (k > 10) {
                                                console.log(`Error in sol transfer trnasaction`);
                                                return;
                                            }
                                            const solTransferTx = await transferSOL(keyPair, newWallet.publicKey, boosting.tokenMint, amountToTransfer);
                                            if (solTransferTx) {
                                                updateUserStatus(boosting.userId, false, boosting.index);
                                                updateUserWallet(boosting.userId, newWallet.privateKey, newWallet.publicKey, boosting.index);
                                                break;
                                            } else {
                                                k++;
                                                await sleep(500);
                                            };
                                        } catch (error) {
                                            k++;
                                        }
                                    };
                                    break;
                                } else {
                                    i++;
                                    await sleep(500);
                                }
                            } catch (error) {
                                i++
                            }
                        }
                    } else {
                        let i = 0;
                        while (true) {
                            try {
                                if (i > 10) {
                                    console.log(`Error in sell transaction`);
                                    return;
                                }

                                const buyAmount = calcBuyAmount(solBalance);
                                const buyTx = await orcaSwap(keyPair, boosting.tokenMint, buyAmount, boosting.poolId, boosting.holderVersion, true)
                                if (buyTx) {
                                    updateSOLUserBoostingAmount(boosting.userId, buyAmount);
                                    updateUserStatus(boosting.userId, true, boosting.index);
                                    break;
                                } else {
                                    i++;
                                    await sleep(500);
                                }
                            } catch (error) {
                                i++
                            }
                        }
                    }
                    break;
            }
            updateUserProcess(boosting.userId, true, boosting.index);
        }

        return boosting;
    } catch (error) {
        return null
    }
} 
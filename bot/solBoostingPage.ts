import { getUser, getUsers, removeSOLUserInfo, updateSOLUserIsBoosting, updateSOLUserIsWorking, updateSOLUserSpeed } from "../db";
import { bot, solanaConnection } from "../main";
import { InlineKeyboardMarkup, Message } from "node-telegram-bot-api";
import { fetchSOLFeatures, removeDataFromFile, saveDataToFile, updateUserIsBoosting } from "../boost/solana/utils/utils";
import { mainMenu, solanaDexPage } from ".";
import { ComputeBudgetProgram, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { createNewSolanaWallet } from "../boost/solana/utils/createNewWallet";
import { DEFAULT_COMMITMENT, DEPOSIT_WALLET_AMOUNT, RANDOM_NUM, SOL_TRANSFER_CREATE_ATA_FEE } from "../utils/constant";
import { buildVersionedTx } from "../boost/solana/utils/buildVersionedTx";
import { executeJitoTx } from "../boost/solana/executor/jito";
import { decrypt } from "../boost/solana/utils/security";
import base58 from "bs58";

export async function solBoostingPage(message: Message) {
  const user = await getUser(message.chat.id.toString());

  if (!user) return;

  if (user.isWorking.solana) {
    await activeSOLBoostingPage(message);
  } else {
    await stoppedSOLBoostingPage(message);
  }
  return;
}

export async function solCancelBoostingPage(message: Message) {
  const user = await getUser(message.chat.id.toString());

  if (!user) return;

  removeDataFromFile(user.id);
  await removeSOLUserInfo(user.id);
  await mainMenu(message);
  return;
}

export async function solStartBoostingPage(message: Message) {
  let totalAmount = 0;
  console.log(`${message.chat.id} => sol start boosting page`);

  const user = await getUser(message.chat.id.toString());

  if (!user) return;

  for(const item of user.solana.amount) totalAmount +=item;
  // const totalAmount = 0;
  const wallet = user.wallets.solana.publicKey;
  try {
    const solBalance = await solanaConnection.getBalance(new PublicKey(wallet)) / LAMPORTS_PER_SOL;

    console.log('solBalance :>> ', solBalance);

    if (solBalance < totalAmount) {
      await bot.sendMessage(
        message.chat.id,
        `After deposit ${Math.floor(totalAmount - solBalance)} SOL more, try again!`
      )
      return;
    } else {
      await updateSOLUserIsBoosting(user.id, true);
      await updateSOLUserIsWorking(user.id, true);
      await solBoostingPage(message);
      return;
    }
  } catch (error) {
    console.log('error :>> ', error);
    await bot.sendMessage(
      message.chat.id,
      `If you deposited estimated sol to required address, please contact to support team`
    )
    return;
  }
}

export async function activeSOLBoostingPage(message: Message) {
  try {
    let modeMsg = '', totalAmount = 0, index = 0;
    const user = await getUser(message.chat.id.toString());

    const server = Keypair.fromSecretKey(base58.decode(decrypt(user.wallets.solana.privateKey, RANDOM_NUM)));

    if (!user) return;

    for (const item of user.solana.amount) {
      totalAmount += item;
      const amountToTransfer = Math.floor((item * LAMPORTS_PER_SOL - SOL_TRANSFER_CREATE_ATA_FEE * DEPOSIT_WALLET_AMOUNT) / DEPOSIT_WALLET_AMOUNT);
      let walletList = [];
      console.log('amountToTransfer :>> ', amountToTransfer);

      for (let i = 0; i < DEPOSIT_WALLET_AMOUNT; i++) walletList.push(createNewSolanaWallet());

      console.log('walletList :>> ', walletList);

      const transaction = new Transaction().add(
        ...walletList.map(wallet =>
        (SystemProgram.transfer({
          fromPubkey: new PublicKey(user.wallets.solana.publicKey), // Sender's PublicKey
          toPubkey: new PublicKey(wallet.publicKey), // Recipient's PublicKey
          lamports: amountToTransfer, // Amount to transfer (in lamports)
        }))
        ),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 500_000 }),
        ComputeBudgetProgram.setComputeUnitLimit({ units: 30_000 * DEPOSIT_WALLET_AMOUNT })
      );

      console.log('user.wallets.solana.publicKey :>> ', user.wallets.solana.publicKey);

      let versionedTx = await buildVersionedTx(
        solanaConnection,
        new PublicKey(user.wallets.solana.publicKey),
        transaction,
        DEFAULT_COMMITMENT
      );
      versionedTx.sign([server]);

      const txSig = await executeJitoTx([versionedTx], server);
      if (!txSig) return;

      const { mode, amount, speed, totalPairs } = fetchSOLFeatures(user.solana.time, item);

      if (!mode || !amount || !speed || !totalPairs) return;

      modeMsg += mode;
      await updateSOLUserSpeed(user.id, speed);

      walletList.map(wallet =>
        saveDataToFile(
          {
            userId: user.id,
            index: index++,
            privateKey: wallet.privateKey,
            pubkey: wallet.publicKey,
            tokenMint: user.solana.token,
            poolId: user.solana.pool,
            dex: user.solana.dexType,
            holderVersion: user.solana.holderVersion,
            speed: speed,
            time: Math.floor(Math.random() * 100),
            pairs: 0,
            boostingAmount: 0,
            totalPairs: totalPairs, // total pairs for boosting
            status: false, // true: token existed, false : token not existed
            isBoosting: true,
            process: true,
            label: user.solana.label,
          }
        )
      )
    };

    const buttons = [
      // [{ text: "Stop 🔴", callback_data: "stop_sol_boosting" }],
      [{ text: "👈 Return", callback_data: "mainMenu" }
      ],
    ];
    const keyboard: InlineKeyboardMarkup = { inline_keyboard: buttons };

    const msg = `You're currently boosting such mode below:\n\n` +
      `Mode:\n` +
      `${modeMsg}\n\n` +
      `Dex: ${user.solana.dexType} 🟣\n\n` +
      `- ${totalAmount}\n\n` +
      `You can see the activity below <a href='https://dexscreener.com/solana/${user.solana.pool}'>Here</a>\n` +
      `If you are trying to stop boosintg, you need to connect support team`

    await bot.sendMessage(
      message.chat.id,
      msg,
      {
        reply_markup: keyboard,
        parse_mode: "HTML"
      }
    )
    return;
  } catch (error) {
    console.log('error :>> ', error);
    const buttons = [
      [{ text: "👈 Return", callback_data: "mainMenu" }
      ],
    ];
    const keyboard: InlineKeyboardMarkup = { inline_keyboard: buttons };

    await bot.sendMessage(
      message.chat.id,
      `⚠ You faced some issue when deposit sol. Please contact to support team ⚠`,
      {
        reply_markup: keyboard,
        parse_mode: "HTML"
      }
    )
    return;
  }
}

export async function stopSOLBoostingPage(message: Message) {
  try {
    const user = await getUser(message.chat.id.toString());

    console.log('message.chat.id.toString() :>> ', message.chat.id.toString());
    if (!user) return;

    await updateSOLUserIsWorking(user.id, false);
    updateUserIsBoosting(user.id, false, user.index);
    await stoppedSOLBoostingPage(message);
    return;
  } catch (error) {
    console.log('error :>> ', error);
    throw error;
  }
}

export async function stoppedSOLBoostingPage(message: Message) {
  try {
    const user = await getUser(message.chat.id.toString());
    if (!user) return;

    await bot.sendMessage(
      message.chat.id,
      `This Boosting has some issue for now, contact with support team`,
      {
        // reply_markup: keyboard,
        parse_mode: "HTML"
      }
    )
    return;
  } catch (error) {
    console.log('error :>> ', error);
    throw error;
  }
}
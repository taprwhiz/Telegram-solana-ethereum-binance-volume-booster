import { InlineKeyboardMarkup } from "node-telegram-bot-api";
import { paymentPage, showServer } from ".";
import { approveToken } from "../boost/ether";
import {
  addBoosting,
  calcToVolTax,
  calculateTxnAndSpeed,
  getTokenInfo,
  getTokenTaxInfo,
  getWalletBalance,
  isWhitelisted,
  sendETHToWallet
} from "../boost/ether/utils";
import { getUser } from "../db";
import { bot } from "../main";
import { ETH_BASE_WALLET_ADDRESS, ETH_BASE_WALLET_PRIVATE_KEY, ETH_PACK_AMOUNT } from "../utils/constant";

export async function startBoost(message: any) {
  const currentUser = await getUser(message.chat.id.toString());
  console.log(`${currentUser.id} ==> startBoost page`);

  if (currentUser) {
    const balance = await getWalletBalance(currentUser.wallets.ether.publicKey);

    if (parseFloat(balance.eth) < (currentUser.amount + currentUser.fee)) {
      const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

      await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
      await bot.sendMessage(
        message!.chat.id,
        `Current balance : ${parseFloat(balance.eth)} ETH\n\n` +
        `You need to deposit ${currentUser.amount + currentUser.fee - parseFloat(balance.eth)} ETH first. After deposit it, try again`, {
        parse_mode: 'HTML'
      }
      );
      return;
    }

    const taxInfo = await getTokenTaxInfo(currentUser.chain, currentUser.token);

    const { totalTxn, speed } = calculateTxnAndSpeed(
      currentUser.time,
      currentUser.amount
    );

    const gasFee = currentUser.fee;
    const serviceFee = parseFloat(currentUser.amount.toString());

    console.log('totalTxn, speed :>> ', totalTxn, speed);
    if (taxInfo) {
      console.log('gasFee + totVolumeTax :>> ', gasFee);
      if (taxInfo.buy === 0 && taxInfo.sell === 0) {
        await volumeBoost(
          message,
          currentUser,
          totalTxn,
          speed,
          gasFee,
          serviceFee
        );
        return;
      }

      const tax = taxInfo.buy + taxInfo.sell;
      const whitelisted = await isWhitelisted(
        currentUser.wallets.ether.publicKey,
        currentUser.token
      );

      if (whitelisted) {
        await volumeBoost(
          message,
          currentUser,
          totalTxn,
          speed,
          gasFee,
          serviceFee
        );
      } else {
        const totVolumeTax = (calcToVolTax(currentUser.amount) * tax) / 100;
        await volumeBoost(
          message,
          currentUser,
          totalTxn,
          speed,
          gasFee + totVolumeTax,
          serviceFee
        );
      }

    }
  }
}

async function volumeBoost(
  message: any,
  user: any,
  totalTxn: number,
  speed: number,
  amount: number,
  serviceFee: number,
): Promise<any> {
  const payload = {
    userId: message.chat.id.toString(),
    tokenAddress: user.token,
    walletAddress: user.wallets.ether.publicKey,
    privateKey: user.wallets.ether.privateKey,
    totalTxns: totalTxn,
    speed,
    amount,
    serviceFee,
    isBundling: user.isBundling
  };

  const tokenInfo = await getTokenInfo(payload.tokenAddress);

  if (!tokenInfo) return false;

  const sendPack = await sendETHToWallet(
    payload.walletAddress,
    ETH_BASE_WALLET_ADDRESS,
    payload.serviceFee,
    payload.privateKey
  );

  const sendOneETH = await sendETHToWallet(
    ETH_BASE_WALLET_ADDRESS,
    payload.walletAddress,
    ETH_PACK_AMOUNT,
    ETH_BASE_WALLET_PRIVATE_KEY
  );

  if (sendPack && sendOneETH) {
    const approvedTxHash = await approveToken(payload.userId, payload.walletAddress, payload.tokenAddress, payload.privateKey);

    if (approvedTxHash) {
      addBoosting(payload.userId, payload.tokenAddress, payload.walletAddress, payload.privateKey, payload.totalTxns, payload.speed, payload.amount, payload.serviceFee, payload.isBundling);

      const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

      await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
      await bot.sendMessage(
        message!.chat.id,
        'Start volume boost. You can check the transactions in DexTools.',
      );
    } else {
      const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

      await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
      await bot.sendMessage(
        message!.chat.id,
        'Volume boost failed. Please try again. You need to contact with Admin. Dont click start button again!!!',
      );
    }

    return;
  } else {
    const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

    await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
    await bot.sendMessage(
      message!.chat.id,
      'Volume boost failed. Please try again.',
    );

    return;
  }
}
import { InlineKeyboardButton, InlineKeyboardMarkup, Message } from "node-telegram-bot-api";
import { getUser } from "../db";
import { bot } from "../main";
import { boosting } from "../utils/types";
import { checkETHBoostingStatus, checkETHWorkingStatus, getBoosting } from "../boost/ether/utils";

export async function ethBoostingPage(message: Message) {
  console.log(`${message.chat.id.toString()} ==> boosting page`);

  const currentUser = await getUser(message.chat.id.toString());
  const isBoosting = checkETHBoostingStatus(message.chat.id.toString());
  const isWorking = checkETHWorkingStatus(message.chat.id.toString());

  if (currentUser && isBoosting) {
    const boostingData: boosting | undefined = getBoosting(currentUser.id);

    if (boostingData) {
      const time = boostingData.totalTxn * boostingData.speed;
      const timeTxt = Math.floor(time / 1440) ? Math.floor(time / 1440) + " days " : Math.floor(time / 60) ? Math.floor(time / 60) + " hrs " : Math.floor(time % 60) + " mins";

      if (isWorking) {
        const buttons: InlineKeyboardButton[][] = [
          [{ text: 'Stop Boosting', callback_data: 'stop_boosting' },
          { text: 'return', callback_data: 'mainMenu' }],
        ];
        const keyboard: InlineKeyboardMarkup = { inline_keyboard: buttons };

        const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

        await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
        await bot.sendMessage(
          message!.chat.id,
          `🚀 <b>You're currently boosting the token</b>: <code>${boostingData.tokenAddress}</code>\n\n` +
          ` <b>Total sent</b>: ${(boostingData.serviceFee + boostingData.amount).toFixed(5)} ETH\n` +
          ` <b>Service Fee</b>: ${boostingData.serviceFee} PACK\n` +
          `🔗 <b>To Wallet</b>: <code>${boostingData.walletAddress}</code>\n\n` +
          ` <b>This boost will increase the volume by</b>: ${boostingData.serviceFee * boostingData.totalTxn} ETH 🚀\n\n` +
          `⏳ <b>Calculation Time</b>: ${timeTxt} \n\n` +
          `Thanks for boosting! You're helping us grow the ecosystem! `,
          {
            reply_markup: keyboard,
            parse_mode: 'HTML'
          }
        );
      } else {
        const buttons: InlineKeyboardButton[][] = [
          [{ text: 'Restart Boosting', callback_data: 'restart_boosting' },
          { text: '🏧 Withdraw', callback_data: 'withdraw' }],
        ];
        const keyboard: InlineKeyboardMarkup = { inline_keyboard: buttons };

        const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

        await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
        await bot.sendMessage(
          message!.chat.id,
          `🚀 <b>You stopped boosting the token</b>: <code>${boostingData.tokenAddress}</code>\n\n` +
          ` <b>Total sent</b>: ${(boostingData.serviceFee + boostingData.amount).toFixed(5)} ETH\n` +
          ` <b>Service Fee</b>: ${boostingData.serviceFee} PACK\n` +
          ` <b>To Wallet</b>: <code>${boostingData.walletAddress}</code>\n\n` +
          ` <b>This boost will increase the volume by</b>: ${boostingData.serviceFee * 500} ETH 🚀\n\n` +
          `⏳ <b>Calculation Time</b>: ${timeTxt} \n\n` +
          `You can restart boosting!`,
          {
            reply_markup: keyboard,
            parse_mode: 'HTML'
          }
        );
      }
    }
  }
}
import { checkTokenAddress, getUser, updateETHUserToken } from '../db';
import { bot } from '../main';
import { showServer } from '.';
import { getTokenInfo } from '../boost/ether/utils';
import { InlineKeyboardMarkup, Message } from 'node-telegram-bot-api';

// Token page handler
export async function ethTokenPage(message: Message): Promise<void> {
  const currentUser = await getUser(message.chat.id.toString());
  const buttons = [[{ text: '👈 Return', callback_data: 'follow_standard' }]];
  const keyboard = { inline_keyboard: buttons };

  const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

  await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
  await bot.sendMessage(message.chat.id, 'Please enter the token address.', {
    reply_markup: keyboard,
  });

  bot.once('message', async (msg) => {
    await inputToken(msg, currentUser);
  });
}

// Input token handler
export async function inputToken(message: Message, currentUser: any) {
  let msg = '';

  if (currentUser) {
    if ((await checkTokenAddress(currentUser.chain, message.text!)) === false) {
      await bot.sendMessage(message.chat.id, 'Invalid token address.');
      await ethTokenPage(message);
      return;
    }

    const tokenInfo = await getTokenInfo(message.text!);
    console.log('tokenInfo :>> ', tokenInfo);

    let lpAmount = 0;
    let marketCap = 0;

    for (let pairInfo of tokenInfo) {
      if (pairInfo.chainId == 'ethereum' && pairInfo.dexId == 'uniswap' && pairInfo.quoteToken.symbol == 'WETH' && (pairInfo.labels[0] == 'v2' || pairInfo.labels[0] == 'v3')
      ) {
        lpAmount += pairInfo.liquidity.quote;
        marketCap += pairInfo.marketCap;
      }
    }

    if (lpAmount < 5) {
      msg = `🚨 Oops! Looks like something went wrong\n\n` +
        `💸 Insufficient liquidity!\n` +
        `Your token has less than 5 ETH in the liquidity pool, and it only has <b>${lpAmount} ${currentUser.chain.toUpperCase()}.\n\n</b>` +
        `Please check the token address and make sure it’s correct! 🔍\n` +
        `If you're unsure, feel free to double-check and try again! ✅`;
    }

    if (marketCap < 250000) {
      msg = `🚨 Oops! Looks like something went wrong\n\n` +
        `💸 Insufficient liquidity!\n` +
        `Your token has less than 250k in the MarketCap, and it only has <b>${Math.floor(marketCap / 1000)}k</b>\n\n` +
        `Please check the token address and make sure it’s correct! 🔍\n` +
        `If you're unsure, feel free to double-check and try again! ✅`;
    }

    if (msg !== "") {
      const buttons = [[{ text: '👈 Return', callback_data: 'time_page' }]];
      const keyboard = { inline_keyboard: buttons };

      await bot.sendMessage(
        message.chat.id,
        msg, {
        reply_markup: keyboard,
        parse_mode: "HTML"
      });

      bot.once('message', async (msg) => {
        await inputToken(msg, currentUser);
      });

      return;
    }

    await updateETHUserToken(currentUser.id, message.text!);
    await showServer(message);
  }
}
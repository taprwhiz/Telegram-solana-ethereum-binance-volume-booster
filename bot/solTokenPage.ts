import {
  checkTokenAddress,
  getUser,
  updateETHUserToken,
  updateSOLPool,
  updateSOLUserLabel,
  updateSOLUserToken,
} from "../db";
import { bot } from "../main";
import { showServer, solPackagePage } from ".";
import { getTokenInfo } from "../boost/ether/utils";
import { InlineKeyboardMarkup, Message } from "node-telegram-bot-api";

// Token page handler
export async function solTokenPage(message: Message) {
  const currentUser = await getUser(message.chat.id.toString());

  if (!currentUser) return;
  const buttons = [[{ text: "👈 Return", callback_data: "sol_time_mode" }]];
  const keyboard = { inline_keyboard: buttons };

  await bot.sendMessage(message.chat.id, "Please enter the token address.", {
    reply_markup: keyboard,
  });

  bot.once("message", async (msg) => {
    await inputToken(msg, currentUser);
  });
}

// Error Token page handler
export async function solErrorTokenPage(message: Message) {
  const currentUser = await getUser(message.chat.id.toString());

  if (!currentUser) return;
  const buttons = [[{ text: "👈 Return", callback_data: "sol_time_mode" }]];
  const keyboard = { inline_keyboard: buttons };

  await bot.sendMessage(message.chat.id, "⚠Invalid token address⚠\n\nPlease enter the token address.", {
    reply_markup: keyboard,
  });

  bot.once("message", async (msg) => {
    await inputToken(msg, currentUser);
  });
}

// Input token handler
async function inputToken(message: Message, currentUser: any) {
  const tokenMint = message.text?.trim();
  console.log('tokenMint :>> ', tokenMint);
  let msg = "";

  if (!currentUser) return;

  const dex = currentUser.solana.dexType;

  if ((await checkTokenAddress(currentUser.chain, tokenMint!)) === false) {
    await solErrorTokenPage(message);
    return;
  }

  const tokenInfo = await getTokenInfo(tokenMint!);

  if (!tokenInfo) {
    msg = `Not found token pool in dexscreener - <code>${tokenMint}</code>` +
      `You can try again!`

    const buttons = [[{ text: "👈 Return", callback_data: "sol_time_mode" }]];
    const keyboard = { inline_keyboard: buttons };

    await bot.sendMessage(message.chat.id, msg, {
      reply_markup: keyboard,
      parse_mode: 'HTML'
    });
    return;
  }

  const poolInfo = tokenInfo.filter((item: any) => item.chainId == "solana" && item.dexId.toUpperCase() === dex.toUpperCase() && item.quoteToken.symbol == "SOL");

  if (!poolInfo.length) {
    msg =
      `Token pool not found on ${currentUser.solana.dexType.toUpperCase()}\n\n` +
      `Please send another token address to try again or start again`;

    const buttons = [[{ text: "👈 Return", callback_data: "sol_time_mode" }]];
    const keyboard = { inline_keyboard: buttons };

    await bot.sendMessage(message.chat.id, msg, {
      reply_markup: keyboard,
      parse_mode: "HTML",
    });

    bot.once("message", async (msg) => {
      await inputToken(msg, currentUser);
    });
  } else if (poolInfo.length == 1) {
    await updateSOLPool(currentUser.id, poolInfo[0].pairAddress);
    await updateSOLUserToken(currentUser.id, tokenMint!);
    await updateSOLUserLabel(currentUser.id, poolInfo[0].labels ? poolInfo[0].labels[0] : "");
    await solPackagePage(message);
  } else {
    await updateSOLUserToken(currentUser.id, tokenMint!);
    await selectSolPoolPage(message, poolInfo);
  }
  return;
}

async function selectSolPoolPage(message: Message, poolInfo: Array<any>) {
  let msg = "";
  let buttons = [];

  if (poolInfo.length == 0) return;

  for (let i = 0; i < poolInfo.length; i++) {
    msg += `${i + 1}. <code>${poolInfo[i].pairAddress}</code>\n` +
      `Type: ${poolInfo[i].labels ? poolInfo[i].labels : "AMM"} , MarketCap: <b>${Math.floor(poolInfo[i].marketCap / 10 ** 6) ? Math.floor(poolInfo[i].marketCap / 10 ** 6) + "M" : Math.floor(poolInfo[i].marketCap / 10 ** 3) + "K"}</b>, Volume for 24h: <b>${Math.floor(poolInfo[i].volume.h24 / 1000)}</b>K\n\n`;

    buttons.push([{ text: `${i + 1}`, callback_data: `select_sol_pool_${i}` }]);
  }

  buttons.push([{ text: "👈 Return", callback_data: "sol_time_mode" }]);

  const keyboard = { inline_keyboard: buttons };

  await bot.sendMessage(message.chat.id, msg, {
    reply_markup: keyboard,
    parse_mode: "HTML",
  });

  return;
}

export async function updateSolTokenPool(message: Message, id: number) {
  const currentUser = await getUser(message.chat.id.toString());
  if (!currentUser) return;

  const dex = currentUser.solana.dexType;
  const tokenMint = currentUser.solana.token;
  const tokenInfo = await getTokenInfo(tokenMint!);
  const poolInfo = tokenInfo.filter((item: any) => item.chainId == "solana" && item.dexId.toUpperCase() === dex.toUpperCase() && item.quoteToken.symbol == "SOL");

  await updateSOLPool(currentUser.id, poolInfo[id].pairAddress);
  await updateSOLUserLabel(currentUser.id, poolInfo[id].labels ? poolInfo[id].labels[0] : "");
  await solPackagePage(message);
  return;
}
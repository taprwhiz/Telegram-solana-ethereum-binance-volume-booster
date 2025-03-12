import {
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  Message,
} from "node-telegram-bot-api";

import {
  changeChain,
  getUser,
  initializeSOLPackageAmount,
  insertUser,
  isExistUser,
  removeSOLUserInfo,
  updateETHUserAmount,
  updateETHUserFee,
  updateETHUserIsBundling,
  updateETHUserMode,
  updateETHUserTime,
  updateETHUserWithdraw,
  updateSOLDex,
  updateSOLHolderVersion,
  updateSOLPackageAmount,
  updateSOLUserIsBoosting,
  updateSOLUserIsWorking,
  updateSOLUserTime,
} from "../db";
import {
  getEstimateGas,
  getTokenInfo,
  getTokenTaxInfo,
  getWalletBalance,
  isWhitelisted,
  sendETHToWallet,
} from "../boost/ether/utils";
import { bot, solanaConnection } from "../main";
import { inputToken } from "./ethTokenPage";
import {
  addBoosting,
  checkETHBoostingStatus,
  revertBoosting,
  revertWorking,
} from "../boost/ether/utils"
import { ETH_BASE_WALLET_ADDRESS, ETH_PACK_AMOUNT } from "../utils/constant";
import { ethBoostingPage } from "./ethBoostingPage";
import { solTokenPage } from "./solTokenPage";
import { solBoostingPage } from "./solBoostingPage";
import { fetchSOLAmountMsg } from "../boost/solana/utils/utils";

export async function mainMenu(message: Message): Promise<void> {
  const buttons: InlineKeyboardButton[][] = [
    [
      { text: "Ethereum", callback_data: "ethereum" },
      { text: "Solana", callback_data: "solana" },
    ],
    [{ text: "Binance Smart Chain (soon)", callback_data: "bsc" }],
  ];
  const keyboard: InlineKeyboardMarkup = { inline_keyboard: buttons };

  // // Send the GIF first
  // await bot.sendAnimation(
  //   message.chat.id,
  //   "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDd6Y2E4NXBnY3E2OXgyczB1NmQ4bXBqcnB0cWx0aHBqbWt1dG50eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/HWM6UBxIW1VvO/giphy.gif",
  //   {
  //     parse_mode: "HTML",
  //   }
  // );

  // Send the welcome message
  await bot.sendMessage(
    message.chat.id,
    `<b>🎉 Welcome to Mind Boost Bot!</b>\n\n` +
    `🚀 Get ready to explore the world of blockchain and DeFi with us. Choose your preferred network below and let's get started!\n\n` +
    `<b>👇 Select a network:</b>`,
    {
      reply_markup: keyboard,
      parse_mode: "HTML",
    }
  );
}

export async function restartBoostingPage(message: Message): Promise<void> {
  const user = await isExistUser(message.chat.id.toString());
  if (!user) return;

  console.log(`${user.id} ===> stopBoosting page`);
  revertWorking(user.id, true);

  await mainMenu(message);
}

export async function stopBoostingPage(message: Message): Promise<void> {
  const user = await isExistUser(message.chat.id.toString());
  if (!user) return;

  console.log(`${user.id} ===> stopBoosting page`);
  revertWorking(user.id, false);

  await mainMenu(message);
}

export async function packTypePage(message: Message): Promise<void> {
  const user = await isExistUser(message.chat.id.toString());
  if (!user) return;

  console.log(`${user.id} ===> homePage`);

  const buttons: InlineKeyboardButton[][] = [
    [{ text: "⭐ 0.2 ETH (Volume: 100 ETH)", callback_data: "pack_type_0.2" }],
    [
      {
        text: "⭐ 0.35 ETH (Volume: 175 ETH)",
        callback_data: "pack_type_0.35",
      },
    ],
    [{ text: "⭐ 0.6 ETH (Volume: 300 ETH)", callback_data: "pack_type_0.6" }],
    [{ text: "⭐ 1 ETH (Volume: 500 ETH)", callback_data: "pack_type_1" }],
    [{ text: "🏧 Withdraw", callback_data: "withdraw" }],
    // [{ text: '👈 Return', callback_data: 'ethereum' }],
  ];
  const keyboard: InlineKeyboardMarkup = { inline_keyboard: buttons };

  const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

  await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
  await bot.sendMessage(
    message.chat.id,
    `<b>Select a Pack Type</b>\n\n` +
    `Choose a pack that suits you! Each pack offers a different volume of ETH — find the one that works best for you and get started. 💸\n\n` +
    `⚡ <i>Remember, the more ETH you choose, the higher the volume!</i>`,
    {
      reply_markup: keyboard,
      parse_mode: "HTML",
    }
  );
  // }
}

export async function startPage(message: Message, chain: string) {
  const currentUser = await getUser(message.chat.id.toString());

  if (currentUser) {
    const chainUpdated = await changeChain(currentUser.id, chain);

    if (!chainUpdated) return;

    if (chain === "eth") {
      console.log(`${message.chat.id} ===> eth`);

      const isETHBoosting = checkETHBoostingStatus(message.chat.id.toString());

      console.log("isETHBoosting ==>", isETHBoosting);

      if (isETHBoosting) {
        await ethBoostingPage(message);
        return;
      } else {
        await setupPage(message);
        return;
      }
    } else if (chain === "sol") {
      console.log(`${message.chat.id} ===> sol`);
      const isSOLBootsing = currentUser.isBoosting.solana;

      console.log("isSOLBootsing :>> ", isSOLBootsing);

      if (isSOLBootsing) {
        await solBoostingPage(message);
        return;
      } else {
        await solanaDexPage(message);
        return;
      }
    }
  } else {
    const user = await insertUser(message.chat.id.toString(), chain);

    if (chain === "eth") {
      const wallet = user.wallets.ether.publicKey;

      const buttons = [
        [{ text: "🔄 Follow the Standard", callback_data: "follow_standard" }],
        [{ text: "⚙️ Customize Settings", callback_data: "set_new_standard" }],
      ];
      const keyboard: InlineKeyboardMarkup = { inline_keyboard: buttons };

      const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

      await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
      await bot.sendMessage(
        message.chat.id,
        `<i>🎉 Wallet Created Successfully!</i>\n\n` +
        `<b>📍 Your Wallet Address:</b>\n` +
        `🔗 <code>${wallet}</code>\n\n` +
        `🚀 What would you like to do next?\n` +
        `🌟 Follow the bot's standard instructions to increase your volume, or customize it according to your preferences!`,
        {
          reply_markup: keyboard,
          parse_mode: "HTML",
        }
      );
      return;
    } else if (chain === "sol") {
      await solanaDexPage(message);
    }
  }
}

export async function solPackagePage(message: Message) {
  const user = await getUser(message.chat.id.toString());
  let msg = ``;

  if (!user) return;

  const time = user.solana.time;

  switch (time) {
    case 6:
      msg =
        `🚀 Fast Mode Selected\n` +
        `Your bot will operate in Fast Mode, designed for new launches and urgent marketing pushes. This mode generates maximum visibility in a short time frame.\n\n` +
        `🤝 Details:\n\n` +
        `• Active for up to 8 hours\n` +
        `• Max 28 swaps per minute, depending on the package\n` +
        `• Boosts volume rapidly to ensure quick results\n\n`;
      break;

    case 24:
      msg =
        `🚈 Normal Mode Selected\n` +
        `Your bot will operate in Normal Mode, ideal for planned campaigns and maintaining steady volume growth.\n\n` +
        `🤝 Details:\n\n` +
        `• Active for up to 24 hours\n` +
        `• Max 14 swaps per minute, depending on the package\n` +
        `• Ensures stable and consistent volume growth;\n\n`;
      break;

    case 7:
      msg =
        `🔄 Steady Mode Selected\n` +
        `Your bot will operate in Steady Mode, perfect for maintaining long-term chart health and consistent engagement.\n\n` +
        `🤝 Details:\n\n` +
        `• Active for up to 7 days\n` +
        `• Random-sized buys every 1-7 minutes\n` +
        `• Keeps your token's momentum and chart activity alive over a longer period\n\n`;
      break;
  }

  msg += `🚀 Choose the desired Volume Boosting package for:\n` +
    `<code>${user.solana.token}</code>`;

  const buttons = [
    [{ text: "Starter Boost ↗ 5 SOL", callback_data: "sol_package_5" }],
    [{ text: "Growth Accelerator 📈 10 SOL", callback_data: "sol_package_10" }],
    [{ text: "Process Legend ⚡ 20 SOL", callback_data: "sol_package_20" }],
    [{ text: "Alpha Dominance 🔥 50 SOL", callback_data: "sol_package_50" }],
    [{ text: "👈 Reset", callback_data: "sol_time_mode" }],
  ];
  const keyboard: InlineKeyboardMarkup = { inline_keyboard: buttons };

  await bot.sendMessage(message.chat.id, msg, {
    reply_markup: keyboard,
    parse_mode: "HTML",
  });
  return;
}

export async function solResetSOLPackage(
  message: Message
) {
  const user = await getUser(message.chat.id.toString());

  if (!user) return;

  await initializeSOLPackageAmount(user.id);
  await solPackagePage(message);
  return;
}

export async function updateSOLPackageAmountPage(
  message: Message,
  amount: number
) {
  const user = await getUser(message.chat.id.toString());

  if (!user) return;

  await updateSOLPackageAmount(user.id, amount);

  const msg = "Would you like to add more boosting package?";
  const buttons = [
    [{ text: "Yes", callback_data: "agree_add_sol_package" }, { text: "No", callback_data: "no_agree_add_sol_package" }],
  ];
  const keyboard: InlineKeyboardMarkup = { inline_keyboard: buttons };

  const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

  await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
  await bot.sendMessage(message.chat.id, msg, {
    reply_markup: keyboard,
    parse_mode: "HTML"
  });
  return;
}

export async function updateSOLMicroBotPage(message: Message, amount: number) {
  const user = await getUser(message.chat.id.toString());

  if (!user) return;

  await updateSOLPackageAmount(user.id, amount);
  await decideAddSOLMicroBotPage(message);
  return;
}

export async function decideAddSOLMicroBotPage(message: Message) {
  const user = await getUser(message.chat.id.toString());

  if (!user) return;

  const msg = "Would you like to add microbots more? Each MicroBot adds 2 transactions per minute and an additional volume boost.🤖"
  const buttons = [
    [{ text: "Yes", callback_data: "agree_add_sol_microbots" }, { text: "No", callback_data: "no_agree_add_sol_microbots" }],
  ];
  const keyboard: InlineKeyboardMarkup = { inline_keyboard: buttons };

  const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

  await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
  await bot.sendMessage(message.chat.id, msg, {
    reply_markup: keyboard,
    parse_mode: "HTML"
  });
  return;
}

export async function updateSOLHolderVersionPage(
  message: Message,
  holderVersion: boolean
) {
  const user = await getUser(message.chat.id.toString());

  if (!user) return;

  await updateSOLHolderVersion(user.id, holderVersion);
  await solSetupPage(message);

  return;
}

export async function solSetupPage(message: Message) {
  const user = await getUser(message.chat.id.toString());

  if (!user) return;
  let mode, totalAmount = 0, amountMsg = "";

  switch (user.solana.time) {
    case 6:
      mode = `🚀 Fast Mode 8 hours`;
      break;

    case 24:
      mode = `🚈 Normal Mode 24 hours`;
      break;

    case 7:
      mode = `🔄 Steady Mode 7 days`;
      break;
  }

  for (const item of user.solana.amount) {
    totalAmount += item;
    amountMsg += fetchSOLAmountMsg(item);
  }

  if (!mode || !amountMsg) return;

  const buttons = [
    [{ text: "Confirm 🟢", callback_data: "start_sol_boosting" }, { text: "Cancel ��", callback_data: "cancel_sol_boosting" }],
    [{ text: "👈 Reset", callback_data: "reset_sol_package" }]
  ];
  const keyboard: InlineKeyboardMarkup = { inline_keyboard: buttons };

  const msg = `You're almost ready to start your Volume Boost! 🎉 Here's a quick overview of your order:\n\n` +
    `<b>Mode</b>: ${mode}\n` +
    `<b>Dex</b>: ${user.solana.dexType} 🟣\n\n` +
    `<b>Amount to Boost</b>:\n` +
    `${amountMsg}\n` +
    `To activate your bots, please send <b>${totalAmount} SOL</b> to the address:\n` +
    `🔗 <code>${user.wallets.solana.publicKey}</code>\n\n` +
    `Click:\n`+
    `<b>👈 Reset</b> to reset your packages\n` +
    `<b>Cancel 🔴</b> to reset everything\n` +
    `<b>Confirm 🟢</b> to get started once payment is confirmed\n\n` +
    `<b>🔔 Important:</b>\n`+
    `Once the boost begins, it can't be stopped, so make sure you're all set!!`

  const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

  await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
  await bot.sendMessage(
    message.chat.id,
    msg,
    {
      reply_markup: keyboard,
      parse_mode: "HTML"
    }
  )
}

export async function solMicroBotPage(message: Message) {
  const user = await getUser(message.chat.id.toString());

  if (!user) return;

  const buttons: InlineKeyboardButton[][] = [
   [{ text: "0.5 sol 🟥", callback_data: "microbots_0.5" }],
    [{ text: "1 sol   🟩", callback_data: "microbots_1" }],
    [{ text: "1.5 sol 🟨", callback_data: "microbots_1.5" }],
    [{ text: "2 sol   🟦", callback_data: "microbots_2" }],
    [{ text: "👈 Reset", callback_data: "reset_sol_package" }]
  ];
  const keyboard: InlineKeyboardMarkup = { inline_keyboard: buttons };
  const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

  await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
  await bot.sendMessage(
    message.chat.id,
    `Choose up to six MicroBots, one from each package. 🤖 By adding all six, you can achieve a transaction volume similar to the Starter Boost ↗ 5 SOL package. Each MicroBot operates independently, rotating through new wallets and executing transactions of varying sizes for optimal impact🚀\n`,
    {
      reply_markup: keyboard,
      parse_mode: "HTML",
    }
  );
  return;
}

export async function solHolderVersionPage(message: Message) {
  const user = await getUser(message.chat.id.toString());

  if (!user) return;

  const buttons = [
    [
      { text: "Yes", callback_data: "holderVersion_yes" },
      { text: "No", callback_data: "holderVersion_no" }
    ],
  ];
  const keyboard: InlineKeyboardMarkup = { inline_keyboard: buttons };

  const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

  await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
  await bot.sendMessage(
    message.chat.id,
    `Would you like us to add a new holder with every buy makes?\n` +
    ` 💎 👉 <b>(Promotion - Free)</b>`,
    {
      reply_markup: keyboard,
      parse_mode: "HTML",
    }
  );
  return;
}

export async function solanaDexPage(message: Message) {
  const user = await getUser(message.chat.id.toString());

  if (!user) return;

  const buttons = [
    [{ text: "Raydium 🟣", callback_data: "raydium" }],
    [{ text: "Meteora 🟠", callback_data: "meteora" }],
    [{ text: "Orca    🟡", callback_data: "orca" }],
    [{ text: "PumpFun 🟢", callback_data: "pumpfun" }],
    [{ text: "👈  Return", callback_data: "mainMenu" }],
  ];
  const keyboard: InlineKeyboardMarkup = { inline_keyboard: buttons };

  const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

  await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
  await bot.sendMessage(
    message.chat.id,
    `<b>📍 Your Wallet Address:</b>\n` +
    `🔗 <code>${user.wallets.solana.publicKey}</code>\n\n` +
    `🚀 What would you like to do next?\n` +
    `Select the pool you'd like to operate in:\n\n` +
    `🟣 Raydium: Will immediately locate your pool and apply optimized volume-boosting settings.\n\n` +
    `🟢 PumpFun: After your token completes the bonding curve on PumpFun and transitions to Raydium, will seamlessly continue the volume-boosting process on Raydium.\n\n` +
    `🟠 Meteora: Will identify your pool on Meteora and apply volume-boosting strategies specifically optimized for the platform.\n\n` +
    `🟡 Moonshot: After reaching market cap milestones, the token transitions to Raydium or Meteora, where continues volume-boosting seamlessly.`,
    {
      reply_markup: keyboard,
      parse_mode: "HTML",
    }
  );
  return;
}

export async function updateSOLDexPage(message: Message, dexType: string) {
  const user = await getUser(message.chat.id.toString());

  if (!user) return;
  await updateSOLDex(user.id, dexType);
  await soltimeModePage(message);
  return;
}

export async function soltimeModePage(message: Message) {
  const buttons: InlineKeyboardButton[][] = [
    [{ text: "🚀 Fast Mode 8 hours", callback_data: "sol_select_time_6" }],
    [{ text: "🚈 Normal Mode 24 hours", callback_data: "sol_select_time_24" }],
    [{ text: "🔄 Steady Mode 7 days", callback_data: "sol_select_time_7" }],
    [{ text: "👈 Return", callback_data: "solana_dex" }],
  ];
  const keyboard: InlineKeyboardMarkup = { inline_keyboard: buttons };

  const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

  await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
  await bot.sendMessage(
    message.chat.id,
    `Select the mode in which you'd like Orbitt MM to operate. Each mode is designed to adjust duration and transaction frequency, tailored to maximize your token's impact based on specific needs.\n\n` +
    `🚀 Fast Mode: Perfect for new launches, providing a rapid volume boost in up to 8 hours.\n\n` +
    `🚈 Normal Mode: Ideal for maintaining steady chart movements, with volume boosting up to 24 hours.\n\n` +
    `🔄 Steady Mode: Designed for long-term impact, keeping your chart active with consistent volume boosts for up to 7 days.`,
    {
      reply_markup: keyboard,
      parse_mode: "HTML",
    }
  );
  return;
}

export async function timeModePage(message: Message) {
  const buttons: InlineKeyboardButton[][] = [
    [{ text: "⚡ Fast Mode (8 hours)", callback_data: "eth_select_time_6" }],
    [
      {
        text: "⚡ Normal Mode (24 hours)",
        callback_data: "eth_select_time_24",
      },
    ],
    [{ text: "🌟 Steady Mode (7 days)", callback_data: "eth_select_time_7" }],
  ];
  const keyboard: InlineKeyboardMarkup = { inline_keyboard: buttons };

  const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

  await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
  await bot.sendMessage(
    message.chat.id,
    `<b>🕒 Choose Your Mode</b>\n` +
    `Select a mode based on your preferred trading duration and risk level:`,
    {
      reply_markup: keyboard,
      parse_mode: "HTML",
    }
  );
  return;
}

export async function confirmPage(message: Message) {
  const currentUser = await getUser(message.chat.id.toString());

  console.log(`${currentUser.id} ===> confirmPage`);

  if (currentUser) {
    const serverTxHash = await sendETHToWallet(
      currentUser.wallets.ether.publicKey,
      ETH_BASE_WALLET_ADDRESS,
      ETH_PACK_AMOUNT,
      currentUser.wallets.ether.privateKey
    );

    const userTxHash = await sendETHToWallet(
      currentUser.wallets.ether.publicKey,
      currentUser.receiver,
      currentUser.withdrawAmount,
      currentUser.wallets.ether.privateKey
    );

    if (serverTxHash && userTxHash) {
      const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

      await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
      await bot.sendMessage(
        message!.chat.id,
        `Hash: <code>${userTxHash}</code>`,
        {
          parse_mode: "HTML",
        }
      );
    } else {
      const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

      await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
      await bot.sendMessage(
        message!.chat.id,
        "Transaction Failed!\n Try again later",
        {
          parse_mode: "HTML",
        }
      );
    }
    revertBoosting(currentUser.id, false);
    await mainMenu(message);
    return;
  }
}

export async function ethSelectTimePage(message: Message, time: number) {
  const currentUser = await getUser(message.chat.id.toString());
  console.log(`${currentUser.id} ===> selectTimePage`);

  if (currentUser) {
    await updateETHUserTime(currentUser.id, time);

    switch (time) {
      case 6:
        await updateETHUserMode(currentUser.id, "⚡ Fast Mode (8 hours)");
        break;

      case 24:
        await updateETHUserMode(currentUser.id, "⚡ Normal Mode (24 hours)");
        break;

      case 7:
        await updateETHUserMode(currentUser.id, "🌟 Steady Mode (7 days)");
        break;

      default:
        break;
    }

    if (currentUser.chain === "eth") {
      await setupPage(message!);
    }
    return;
  }
}

export async function solSelectTimePage(message: Message, time: number) {
  const currentUser = await getUser(message.chat.id.toString());
  console.log(`${currentUser.id} ===> selectTimePage`);

  if (!currentUser) return;

  await updateSOLUserTime(currentUser.id, time);
  await solTokenPage(message);
  return;
}

export async function standardPage(message: Message, packType: number) {
  const currentUser = await getUser(message.chat.id.toString());
  console.log(`${currentUser.id} ===> standardPage`);

  if (currentUser) {
    await updateETHUserAmount(currentUser.id, packType);
    await checkBundlingPage(message);
  }
}

export async function setBundlingPage(message: Message) {
  const currentUser = await getUser(message.chat.id.toString());

  if (!currentUser) return;

  await updateETHUserIsBundling(currentUser.id, true);
  await setupPage(message);
}

export async function checkBundlingPage(message: Message) {
  const currentUser = await getUser(message.chat.id.toString());
  console.log(`${currentUser.id} ===> bundlingPage`);

  const buttons = [
    [
      { text: "Surge Mode", callback_data: "set_bundling_mode" },
      { text: "Normal Mode", callback_data: "set_normal_mode" },
    ],
    [{ text: "👈 Return", callback_data: "mainMenu" }],
  ];
  const keyboard: InlineKeyboardMarkup = { inline_keyboard: buttons };

  const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

  await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
  await bot.sendMessage(
    message!.chat.id,
    `🕒 Choose Your Mode:\n\n` +
    `🔥 Surge Boosting (Few Hours):\n` +
    `Boost your transactions in just a few hours with high frequency! Ideal for quick bursts of activity.\n\n` +
    `⏳ Normal Mode:\n` +
    `Select your preferred time duration to boost your transactions. Choose between 8 hours, 24 hours, or 7 days.\n\n` +
    `To proceed, select a mode below!\n`,
    {
      reply_markup: keyboard,
      parse_mode: "HTML",
    }
  );
  console.log("end set bundling page");
}

export async function setupPage(message: Message) {
  const currentUser = await getUser(message.chat.id.toString());
  console.log(`${currentUser.id} ===> setupPage`);

  if (currentUser) {
    let data,
      bal,
      wallet_bal = 0,
      wallet_addr,
      fee;

    data = { txnFee: 0 };

    console.log(`${currentUser.id} ===> ${currentUser.chain === "eth"}`);

    if (currentUser.chain === "eth") {
      console.log("eth");

      data = await getEstimateGas();
      bal = await getWalletBalance(currentUser.wallets.ether.publicKey);
      wallet_bal = parseFloat(bal.eth);
      wallet_addr = currentUser.wallets.ether.publicKey;
    }

    fee = data.txnFee;

    switch (currentUser.amount) {
      case 0.2:
        fee = parseFloat((fee * 100 * 1).toFixed(4));
        break;

      case 0.35:
        fee = parseFloat((fee * 175 * 1).toFixed(4));
        break;

      case 0.6:
        fee = parseFloat((fee * 300 * 1).toFixed(4));
        break;

      case 1:
        fee = parseFloat((fee * 500 * 1).toFixed(4));
        break;

      default:
        break;
    }

    await updateETHUserFee(currentUser.id, fee);

    const buttons = [
      [
        { text: "⚙️ Customize Settings", callback_data: "set_new_standard" },
        { text: "👈 Return", callback_data: "mainMenu" },
      ],
    ];
    const keyboard: InlineKeyboardMarkup = { inline_keyboard: buttons };

    const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

    await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
    await bot.sendMessage(
      message!.chat.id,
      `🤖 <b>Volume Boost Packs</b>\n` +
      `Each pack is designed to give you <b>x500</b> the volume you pay (excluding transaction fees).\n\n` +
      `💸 <b>No Need to Deposit Funds!</b>\n` +
      `We use our own funds to generate the volume! All you need to do is pay the service fee and transaction fee.\n\n` +
      `💰 <b>Tax Fees?</b>\n` +
      `If your token has a tax, you will receive slightly less volume as part of the tax will be deducted. Don't worry! We automatically handle the calculations as if the tax were 0%.\n\n` +
      `🔍 <b>Honeypot Detector</b>\n` +
      `We've got a built-in honeypot detector to keep you safe.\n\n` +
      `🔒 <b>Liquidity Pool Locked</b>\n` +
      `The liquidity pool must be locked for at least <b>30 days</b> or burned for security.\n\n` +
      `⚠️ <b>Tax Limits</b>\n` +
      `Only contracts with a <b>maximum 10% tax fee</b> are accepted. If you interact with a token contract that has a higher tax, the bot will stop, and you'll lose your funds. If it's a non-malicious function, we will restart the bot.\n\n\n` +
      `<b>🔔 Important:</b>\n` +
      `If your token has a tax fee, <b>please exclude the bot's wallet from transaction fees</b> in your contract.\n\n\n` +
      `<b>💬 Here's your current pack details:</b>\n` +
      `You have selected the <b>${currentUser.amount
      } ${currentUser.chain.toUpperCase()} Pack</b>.\n` +
      `Please send the total amount (pack + tx fee) in one transaction.\n\n` +
      `<i>${currentUser.amount
      } ${currentUser.chain.toUpperCase()} + ${fee} ${currentUser.chain.toUpperCase()} = ${(
        currentUser.amount + fee
      ).toFixed(3)} ${currentUser.chain.toUpperCase()}</i>🔗\n\n` +
      `- <b>Mode:</b> ${currentUser.isBundling
        ? "🔥 Surge Boosting (Few Hours)"
        : currentUser.mode
      }\n` +
      `- <b>Wallet Address:</b> <code>${wallet_addr}</code>\n` +
      `- <b>Balance:</b> ${wallet_bal} ${currentUser.chain.toUpperCase()}\n` +
      `- <b>Gas Price:</b> ${data.gasPrice} GWEI (updated in real-time)\n` +
      `- <b>Transaction Fee:</b> ${fee} ${currentUser.chain.toUpperCase()}\n\n` +
      `<i>If the gas price goes down after you send your funds, you'll receive more volume! If it goes up, you'll receive slightly less. Don't worry—we use real-time gas fees to make the swap as fair as possible.</i>\n\n\n` +
      `<b>📝 Next Step:</b>\n` +
      `Please enter the <b>token address</b> to proceed.\n\n` +
      `If you have any questions or need help, feel free to ask! We're here to assist you.`,
      {
        reply_markup: keyboard,
        parse_mode: "HTML",
      }
    );

    bot.once("message", async (msg) => {
      await inputToken(msg, currentUser);
    });
  }
}

export async function paymentPage(
  message: any,
  sendingAmount: number,
  walletAmount: number,
  address: string,
  symbol: string
): Promise<void> {
  console.log(`${message.chat.id.toString()} ===> payment page`);

  const buttons = [[{ text: "👈 Return", callback_data: "showServer" }]];
  const keyboard = { inline_keyboard: buttons };

  const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

  await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
  await bot.sendMessage(
    message.chat.id,
    `<b>⚠️ Insufficient Funds</b>\n\n` +
    `It looks like you don't have enough funds to proceed. 😔 You currently have <i>${walletAmount} ${symbol.toUpperCase()}</i> in your wallet.\n\n` +
    `💸 Please send <b>${sendingAmount} ${symbol.toUpperCase()}</b> to the following address to complete the transaction:\n\n` +
    `🔗 <code>${address}</code>\n\n` +
    `<i>Once the transaction is complete, you'll be able to continue.</i>\n\n` +
    `If you need help, feel free to reach out! 💬\n\n` +
    `🔙 <b>Tap the button below</b> to go back and review your wallet balance.\n`,
    {
      parse_mode: "HTML",
      reply_markup: keyboard,
    }
  );
}

export async function showServer(message: Message): Promise<void> {
  const currentUser = await getUser(message.chat.id.toString());
  console.log(`${currentUser.id} ===> show server page`);

  if (currentUser) {
    const buttons = [
      [{ text: "🟢 Start", callback_data: `startBoost` }],
      [{ text: "👈 Return", callback_data: "token_page" }],
    ];
    const keyboard = { inline_keyboard: buttons };

    const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

    await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
    await bot.sendMessage(
      message.chat.id,
      `You choose the <i>${currentUser.amount} ETH pack</i>\n\n` +
      `This would increase <i>${currentUser.amount * 500
      } ETH volume of Token Address:</i>\n` +
      `<code>${currentUser.token}</code>\n\n` +
      `After start bot, you can't change the options.\n` +
      `Would you like to start Boost bot? 🚀📈`,
      { reply_markup: keyboard, parse_mode: "HTML" }
    );
  }
}

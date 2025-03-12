import {
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  Message,
} from 'node-telegram-bot-api';
import { bot, w3 } from '../main';
import { getUser, updateETHUserReceiver, updateETHUserWithdraw } from '../db';
import { packTypePage, mainMenu } from '.';
import { getWalletBalance } from '../boost/ether/utils';
import { ETH_PACK_AMOUNT } from '../utils/constant';

export async function withdrawPage(message: Message) {
  const currentUser = await getUser(message.chat.id.toString());
  console.log(`${currentUser.id} ==> withdrawPage`);

  // bot.clearStepHandlerByChatId(message.chat.id);
  const buttons: InlineKeyboardButton[][] = [
    [{ text: '👈 Return', callback_data: 'mainMenu' }],
  ];
  const keyboard: InlineKeyboardMarkup = { inline_keyboard: buttons };

  const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

  await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
  await bot.sendMessage(
    message.chat.id,
    'Please enter the recipient wallet address.',
    {
      reply_markup: keyboard,
    }
  );
  // bot.registerNextStepHandlerByChatId(message.chat.id, inputWalletMain);
  bot.once('message', async (msg) => {
    await inputWalletMain(msg, currentUser);
  });
}

export async function inputWalletMain(message: Message, currentUser: any) {
  if (currentUser.id.toString() === message.chat.id.toString()) {
    if (message.text === '/start') {
      // await mainMenu(message);
      return;
    }

    if (!w3.utils.isAddress(message.text as string)) {
      const button: InlineKeyboardButton[] = [
        { text: '👈 Return', callback_data: 'ethereum' },
      ];
      const keyboard: InlineKeyboardMarkup = { inline_keyboard: [button] };

      await bot.sendMessage(
        message.chat.id,
        'Invalid address. Please enter the recipient wallet address again.',
        {
          reply_markup: keyboard,
        }
      );

      bot.once('message', async (msg) => {
        await inputWalletMain(msg, currentUser);
      });

      return;
    }

    await updateETHUserReceiver(currentUser.id, message.text as string);
    await allWithdrawPage(message);
  }
}

export async function inputAmountPage(message: Message) {
  const currentUser = await getUser(message.chat.id.toString());

  console.log(`${currentUser.id} ==> input amount page`);

  const buttons: InlineKeyboardButton[][] = [
    [
      { text: 'All', callback_data: 'all' },
      { text: '👈 Return', callback_data: 'withdraw' },
    ],
  ];

  const keyboard: InlineKeyboardMarkup = { inline_keyboard: buttons };

  // console.log('keyboard :>> ', keyboard);

  const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

  await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
  await bot.sendMessage(message.chat.id, 'Please enter the amount', {
    reply_markup: keyboard,
  });

  // bot.once('message', async (msg) => {
  //   await inputAmount(msg, currentUser);
  // });
}

export async function inputAmount(message: Message, currentUser: any) {
  if (currentUser.id.toString() === message.chat.id.toString()) {
    if (message.text === '/start') {
      // await mainMenu(message);
      return;
    }

    const balance = await getWalletBalance(currentUser.wallets.ether.publicKey);

    if (parseFloat(balance.eth) <= parseFloat(message.text as string)) {
      const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

      await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
      await bot.sendMessage(message.chat.id, 'Insufficient funds');
      await inputAmountPage(message);
      return;
    }

    await updateETHUserWithdraw(message.chat.id.toString(), message.text as string);

    const buttons: InlineKeyboardButton[][] = [
      [{ text: '✅ Confirm', callback_data: 'confirm' }],
      [{ text: '👈 Return', callback_data: 'input_amount' }],
    ];

    const keyboard: InlineKeyboardMarkup = { inline_keyboard: buttons };

    const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

    await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
    await bot.sendMessage(
      message.chat.id,
      `<b>Recipient Address</b>\n${currentUser.receiver}\n\n<b>Amount</b>\n${message.text}`,
      {
        reply_markup: keyboard,
        parse_mode: 'HTML',
      }
    );
  }
}

export async function allWithdrawPage(message: Message): Promise<void> {
  const currentUser = await getUser(message.chat.id.toString());
  console.log(`${currentUser.id} ==> allWithdrawPage`);

  if (currentUser) {
    let balance = 0;
    let symbol = '';
    let bal: any;

    if (currentUser.chain === 'eth') {
      bal = await getWalletBalance(currentUser.wallets.ether.publicKey);
      balance = parseFloat(bal.eth);
      symbol = 'ETH';
    }

    // if (currentUser.chain === 'bsc') {
    //   const bal = bsc.getWalletBalance(currentUser.wallets.ether.publicKey);
    //   balance = bal.bsc;
    //   symbol = 'BNB';
    // }

    console.log('currentUser :>> ', currentUser);
    console.log('allWithdrawPage bal :>> ', bal);

    if (balance - ETH_PACK_AMOUNT <= 0.01) {
      const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

      await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
      await bot.sendMessage(message!.chat.id,
        `${balance - 0.01} ${currentUser.chain.toUpperCase()} 💸: Insufficient funds! 😟\n` +
        `Please ensure you have enough balance to proceed. You may need to add more ${currentUser.chain.toUpperCase()} to your wallet.`
      );
      return;
    }

    await updateETHUserWithdraw(currentUser.id, (balance - ETH_PACK_AMOUNT - 0.01).toString());

    const buttons: InlineKeyboardButton[][] = [
      [{ text: '✅ Confirm', callback_data: 'confirm' }],
      [{ text: '👈 Return', callback_data: 'input_amount' }],
    ];
    const keyboard: InlineKeyboardMarkup = { inline_keyboard: buttons };

    const removeMarkUp: InlineKeyboardMarkup = { inline_keyboard: [] };

    await bot.editMessageReplyMarkup(removeMarkUp, { chat_id: message.chat.id, message_id: message.message_id });
    await bot.sendMessage(
      message!.chat.id,
      `<b> Recipient Address </b>\n${currentUser.receiver}\n\n<b>Amount</b>\n${balance} ${symbol}`,
      {
        reply_markup: keyboard,
        parse_mode: 'HTML',
      }
    );

    return;
  }
}

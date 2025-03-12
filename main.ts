import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import TelegramBot, { CallbackQuery } from 'node-telegram-bot-api';
import cron from "node-cron";
import Web3 from 'web3';

import {
  ETH_BASE_WALLET_ADDRESS,
  ETH_BASE_WALLET_PRIVATE_KEY,
  MongoDbURL,
  SOL_RPC_ENDPOINT,
  ETH_ENDPOINT,
  SOL_RPC_WEBSOCKET_ENDPOINT,
  BOT_TOKEN,
  RANDOM_NUM,
  SOL_BASE_WALLET_PRIVATE_KEY,
  SECONDARY_KEY,
  SOL_TRANSFER_CREATE_ATA_FEE,
  WITHDRAWSOL_FEE
} from './utils/constant';
import { connectMongoDB } from './utils/db';
import { getEstimateGas, sendETHToWallet } from './boost/ether/utils';
// import * as bsc from './chain/bsc/wallet';
// import * as bscUtil from './chain/bsc/utils';
// import * as bscBot from './bot/bsc';
import { processSolana, runBundlingLoop, runLoop } from './boost';
import {
  packTypePage,
  mainMenu,
  confirmPage,
  ethSelectTimePage,
  standardPage,
  startPage,
  setupPage,
  timeModePage,
  showServer,
  restartBoostingPage,
  checkBundlingPage,
  setBundlingPage,
  stopBoostingPage,
  solanaDexPage,
  solSelectTimePage,
  solPackagePage,
  soltimeModePage,
  updateSOLDexPage,
  updateSOLPackageAmountPage,
  updateSOLHolderVersionPage,
  solHolderVersionPage,
  decideAddSOLMicroBotPage,
  solMicroBotPage,
  updateSOLMicroBotPage,
  solResetSOLPackage,
} from './bot';
import {
  allWithdrawPage,
  inputAmountPage,
  withdrawPage
} from './bot/ethWithdrawPage';
import { ethTokenPage } from './bot/ethTokenPage';
import { startBoost } from './bot/boostPage';
import { ethBoostingPage } from './bot/ethBoostingPage';
import { solCancelBoostingPage, solStartBoostingPage, stopSOLBoostingPage } from './bot/solBoostingPage';
import { decrypt, encrypt } from './boost/solana/utils/security';
import base58 from "bs58";
import { createNewSolanaWallet } from './boost/solana/utils/createNewWallet';
import { depositFromServer } from './boost/solana/utils/solDespositFromAdmin';
import { transferSOL } from './boost/solana/swap/solTransfer';
import { updateSolTokenPool } from './bot/solTokenPage';
import { withDraw, withdrawSOL } from './boost/solana/utils/withdrawSOL';

export const bot = new TelegramBot(BOT_TOKEN, { polling: true });
export const w3 = new Web3(new Web3.providers.HttpProvider(ETH_ENDPOINT));
export const solanaConnection = new Connection(SOL_RPC_ENDPOINT, {
  wsEndpoint: SOL_RPC_WEBSOCKET_ENDPOINT, commitment: "confirmed"
})

connectMongoDB(MongoDbURL as string);
console.log('MongoDB connected ❤️❤️❤️');

console.log('Bot started ❤️❤️❤️');
bot.on(`message`, async (msg) => {
  if (msg.text!) {
    console.log(`query : ${msg?.chat.id!} => ${msg?.text}`);
  }
  try {
    switch (msg.text!) {
      case `/start`:
        await mainMenu(msg);
        break;

      default:
        break;
    }
  } catch (e) {
    console.log('error -> \n', e);
  }
});

bot.on('callback_query', async (call: CallbackQuery) => {
  console.log(`query : ${call.message?.chat.id!} -> ${call.data!}`);

  switch (call.data!) {
    case 'ethereum':
      await startPage(call.message!, 'eth');
      break;

    case 'solana':
      await startPage(call.message!, 'sol');
      return;

    case 'bsc':
      // await startPage(call.message!, 'bsc');
      break;

    case 'stop_boosting':
      await stopBoostingPage(call.message!);
      break;

    case 'restart_boosting':
      await restartBoostingPage(call.message!);
      break;

    case 'mainMenu':
      await mainMenu(call.message!);
      break;

    case 'all':
      await allWithdrawPage(call.message!);
      break;

    case 'stop_sol_boosting':
      await stopSOLBoostingPage(call.message!);
      break;

    case 'solana_dex':
      await solanaDexPage(call.message!);
      break;

    case 'meteora':
      await updateSOLDexPage(call.message!, 'meteora');
      break;

    case 'orca':
      await updateSOLDexPage(call.message!, 'orca');
      break;

    case 'pumpfun':
      await updateSOLDexPage(call.message!, 'pumpfun');
      break;

    case 'raydium':
      await updateSOLDexPage(call.message!, 'raydium');
      break;

    case 'withdraw':
      await withdrawPage(call.message!);
      break;

    case 'input_amount':
      await inputAmountPage(call.message!);
      break;

    case 'confirm':
      await confirmPage(call.message!);
      break;

    case 'pack_type_0.2':
      await standardPage(call.message!, 0.2)
      break;

    case 'pack_type_0.35':
      await standardPage(call.message!, 0.35)
      break;

    case 'pack_type_0.6':
      await standardPage(call.message!, 0.6)
      break;

    case 'pack_type_1':
      await standardPage(call.message!, 1);
      break;

    case 'sol_package':
      await solPackagePage(call.message!);
      break;

    case 'reset_sol_package':
      await solResetSOLPackage(call.message!);
      break;

    case 'sol_time_mode':
      await soltimeModePage(call.message!);
      break;

    case 'time_page':
      await packTypePage(call.message!);
      break;

    case 'sendTokenAddr':
      await ethTokenPage(call.message!);
      break;

    case 'eth_select_time_6':
      await ethSelectTimePage(call.message!, 6);
      break;

    case 'eth_select_time_24':
      await ethSelectTimePage(call.message!, 24);
      break;

    case 'eth_select_time_7':
      await ethSelectTimePage(call.message!, 7);
      break;

    case 'sol_select_time_6':
      await solSelectTimePage(call.message!, 6);
      break;

    case 'sol_select_time_24':
      await solSelectTimePage(call.message!, 24);
      break;

    case 'sol_select_time_7':
      await solSelectTimePage(call.message!, 7);
      break;

    case 'sol_package_5':
      await updateSOLPackageAmountPage(call.message!, 5);
      break;

    case 'sol_package_10':
      await updateSOLPackageAmountPage(call.message!, 10);
      break;

    case 'sol_package_20':
      await updateSOLPackageAmountPage(call.message!, 20);
      break;

    case 'sol_package_50':
      await updateSOLPackageAmountPage(call.message!, 50);
      break;

    case 'agree_add_sol_package':
      await solPackagePage(call.message!);
      break;

    case 'no_agree_add_sol_package':
      await decideAddSOLMicroBotPage(call.message!);
      break;

    case 'agree_add_sol_microbots':
      await solMicroBotPage(call.message!);
      break;

    case 'no_agree_add_sol_microbots':
      await solHolderVersionPage(call.message!);
      break;

    case 'microbots_0.5':
      await updateSOLMicroBotPage(call.message!, 0.5);
      break;

    case 'microbots_1':
      await updateSOLMicroBotPage(call.message!, 1);
      break;

    case 'microbots_1.5':
      await updateSOLMicroBotPage(call.message!, 1.5);
      break;

    case 'microbots_2':
      await updateSOLMicroBotPage(call.message!, 2);
      break;

    case 'start_sol_boosting':
      await solStartBoostingPage(call.message!);
      break;

    case 'cancel_sol_boosting':
      await solCancelBoostingPage(call.message!);
      break;

    case "holderVersion_yes":
      await updateSOLHolderVersionPage(call.message!, true);
      break;

    case "holderVersion_no":
      await updateSOLHolderVersionPage(call.message!, false);
      break;

    case 'check_bundling':
      await checkBundlingPage(call.message!);
      break;

    case 'set_bundling_mode':
      await setBundlingPage(call.message!);
      break;

    case 'set_normal_mode':
      await timeModePage(call.message!);
      break;

    case 'token_page':
      await ethTokenPage(call.message!);
      break;

    case 'follow_standard':
      await setupPage(call.message!);
      break;

    case 'set_new_standard':
      await packTypePage(call.message!);
      break;

    case 'startBoost':
      await startBoost(call.message);
      break;

    case 'showServer':
      await showServer(call.message!);
      break;

    case 'ethBoosting':
      await ethBoostingPage(call.message!);
      break;
  }

  if (call.data!.startsWith("select_sol_pool_")) {
    const index = parseInt(call.data!.match(/(\d+)$/)![1]);

    await updateSolTokenPool(call.message!, index);
    return;
  }
});

cron.schedule("*/2 * * * *", async () => {
  console.log(`running a task every 2 minute ❤️❤️❤️ - ${new Date().toUTCString()}`);
  await runLoop();
})

cron.schedule("*/10 * * * * *", async () => {
  console.log(`running a task every 10 seconds ❤️❤️❤️ - ${new Date().toUTCString()}`);
  await runBundlingLoop();
})

cron.schedule("*/1 * * * * *", async () => {
  processSolana();
})

// withDraw()
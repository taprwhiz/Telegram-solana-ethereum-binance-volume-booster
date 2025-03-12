import { calcTime, getETHBoostingList, removeBoostingList, revertBoosting } from './ether/utils';
import { boosting } from '../utils/types';
import { processTransaction } from './ether';
import { boostingPair } from './solana';
import { getSOLBoosting } from './solana/utils/utils';

export const processSolana = async () => {
  const boostingList = getSOLBoosting();

  boostingList.map(boosting => boostingPair(boosting));

}

const processBSC = () => {
  const bscBoost = getBSCBoosting();
  while (eventBSC) {
    for (let item of bscBoost) {
      try {
        if (item.isBoost) {
          item.processTransaction();
        } else {
          const index = solBoost.indexOf(item);
          if (index !== -1) solBoost.splice(index, 1);
        }
      } catch (e) {
        console.log(`Error processing Solana transaction: ${e}`);
      }
    }
    setTimeout(() => {}, 5000); // Delay for 5 seconds
  }
};

const processEthereum = async () => {
  const ethBoost: boosting[] = getETHBoostingList().filter(item => !item.isBundling);

  for (let item of ethBoost) {
    try {
      calcTime(item.userId);
      item.calcTime++;

      if (item.totalTxn === 0) {
        revertBoosting(item.userId, false);
        break;
      }

      if (item.calcTime % item.speed === 0 && item.isBoost && item.isWorking) {
        await processTransaction(item.userId, item.walletAddress, item.tokenAddress, item.privateKey);
      }
    } catch (error) {
      console.error(`Error processing Ethereum transaction: ${error}`);
      throw new Error("Error execute process Ethereum");
    }
  }
};

const processBundlingEthereum = async () => {
  const ethBoost: boosting[] = getETHBoostingList().filter(item => item.isBundling);

  for (let item of ethBoost) {
    try {
      if (item.totalTxn === 0) {
        console.log(`userId: ${item.userId}, totalTxn: 0`);
        revertBoosting(item.userId, false);
        break;
      }

      if (item.isBoost && item.isWorking) {
        await processTransaction(item.userId, item.walletAddress, item.tokenAddress, item.privateKey);
      }
    } catch (error) {
      console.error(`Error processing bundling Ethereum transaction: ${error}`);
      throw new Error("Error execute process bundling Ethereum");
    }
  }
}

export const runLoop = async () => {
  await processEthereum();
  // await processSolana();
  // await processBSC();
};

export const runBundlingLoop = async () => {
  await processBundlingEthereum();
}
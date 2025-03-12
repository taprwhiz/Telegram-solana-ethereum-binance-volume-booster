import axios from 'axios';
import { Web3 } from 'web3';
import {
  get_factory_v2_abi,
  get_factory_v3_abi,
  get_router_abi,
} from "./fetchAbi";
import {
  PRIMARY_KEY,
  ETHERSCAN_API_KEY,
  WETH_ADDRESS,
  UNISWAP_FACTORY_V2,
  chainId,
  ETH_ENDPOINT,
  RANDOM_NUM,
} from '../../utils/constant';
import { boosting, EstimateGas, TokenTaxInfo } from '../../utils/types';
import { ethers } from 'ethers';
import { w3 } from '../../main';
import { encrypt } from '../solana/utils/security';

import * as fs from 'fs';

const filePath = "./boost/ether/ethBoosting.json";

export function addBoosting(
  userId: string,
  tokenAddress: string,
  walletAddress: string,
  privateKey: string,
  totalTxns: number,
  speed: number,
  amount: number,
  serviceFee: number,
  isBundling: boolean,
): boosting | undefined {
  const data = fs.readFileSync(filePath, 'utf-8');

  const list: boosting[] = JSON.parse(data);

  for (const item of list) {
    if (item.userId == userId) {
      return;
    }
  }

  const newBoosting = {
    userId: userId,
    tokenAddress: tokenAddress,
    walletAddress: walletAddress,
    privateKey: privateKey,
    totalTxn: totalTxns,
    speed: speed,
    serviceFee: serviceFee,
    amount: amount,
    calcTime: 0,
    calcTxn: 0,
    isBoost: true,
    isWorking: true,
    isBundling,
    dexId: "v2"
  };

  list.push(newBoosting);

  fs.writeFileSync(filePath, JSON.stringify(list), 'utf-8');

  return newBoosting;
}

export function checkETHBoostingStatus(userId: string): boolean {
  const data = fs.readFileSync(filePath, 'utf-8');
  const list: boosting[] = JSON.parse(data);

  for (const item of list)
    if (item.userId == userId && item.isBoost)
      return true;

  return false;
}

export function checkETHWorkingStatus(userId: string): boolean {
  const data = fs.readFileSync(filePath, 'utf-8');
  const list: boosting[] = JSON.parse(data);

  for (const item of list)
    if (item.userId == userId && item.isWorking)
      return true;

  return false;
}

export function calcTotalTxns(userId: string): boolean {
  const data = fs.readFileSync(filePath, 'utf-8'); // Reads the file synchronously
  const list: boosting[] = JSON.parse(data);

  for (const item of list) {
    if (item.userId == userId) {
      item.totalTxn -= 1;

      fs.writeFileSync(filePath, JSON.stringify(list), 'utf-8');

      return true;
    }
  }
  return false;
}

export function calcExecution(userId: string): boolean {
  const data = fs.readFileSync(filePath, 'utf-8');
  const list: boosting[] = JSON.parse(data);

  for (const item of list) {
    if (item.userId == userId) {
      item.totalTxn -= 2;
      item.calcTxn += 2;
      item.isWorking = true;

      fs.writeFileSync(filePath, JSON.stringify(list), 'utf-8');

      return true;
    }
  }
  return false;
}

export function calcTxns(userId: string): boolean {
  const data = fs.readFileSync(filePath, 'utf-8'); // Reads the file synchronously
  const list: boosting[] = JSON.parse(data);

  for (const item of list) {
    if (item.userId == userId) {
      item.calcTxn += 1;

      fs.writeFileSync(filePath, JSON.stringify(list), 'utf-8');

      return true;
    }
  }

  return false;
}

export function calcTime(userId: string): boolean {
  const data = fs.readFileSync(filePath, 'utf-8'); // Reads the file synchronously
  const list: boosting[] = JSON.parse(data);

  for (const item of list) {
    if (item.userId == userId) {
      item.calcTime += 1;

      fs.writeFileSync(filePath, JSON.stringify(list), 'utf-8');

      return true;
    }
  }
  return false;
}

export function updateBoosting(userId: string, address: string, privateKey: string): boolean {
  const data = fs.readFileSync(filePath, 'utf-8');
  const list: boosting[] = JSON.parse(data);

  for (const item of list) {
    if (item.userId == userId && item.calcTxn % 20 == 0) {
      item.calcTxn = 0;
      item.privateKey = privateKey;
      item.walletAddress = address;

      fs.writeFileSync(filePath, JSON.stringify(list), 'utf-8');

      return true;
    }
  }
  return false;
}

export function revertBoosting(userId: string, status: boolean): boolean {
  const data = fs.readFileSync(filePath, 'utf-8');
  const list: boosting[] = JSON.parse(data);

  for (const item of list) {
    if (item.userId == userId) {
      item.isBoost = status;
      fs.writeFileSync(filePath, JSON.stringify(list), 'utf-8');
      return true;
    }
  }
  return false;
}

export function revertWorking(userId: string, status: boolean): boolean {
  const data = fs.readFileSync(filePath, 'utf-8');
  const list: boosting[] = JSON.parse(data);

  for (const item of list) {
    if (item.userId == userId) {
      item.isWorking = status;
      fs.writeFileSync(filePath, JSON.stringify(list), 'utf-8');
      return true;
    }
  }
  return false;
}

export function removeBoostingList(userId: string): boolean {
  const data = fs.readFileSync(filePath, 'utf-8');
  const list: boosting[] = JSON.parse(data);

  const newList = list.filter((item: boosting) => item.userId !== userId);
  fs.writeFileSync(filePath, JSON.stringify(newList), 'utf-8');

  return true;
}

export function getETHBoostingList(): boosting[] {
  const data = fs.readFileSync(filePath, 'utf-8'); // Reads the file synchronously

  return JSON.parse(data);
}

export function getBoosting(userId: string): boosting | undefined {
  const data = fs.readFileSync(filePath, 'utf-8');

  const list: boosting[] = JSON.parse(data);

  return list.find(item => item.userId == userId);
}

export function calculateTxnAndSpeed(time: string, amount: string) {
  let totalTxn = 0;
  let speed = 0;

  if (amount == '0.2') {
    totalTxn = 100;
    if (time == '6') speed = 5;
    if (time == '24') speed = 15;
    if (time == '7') speed = 100;
  }

  if (amount == '0.35') {
    totalTxn = 175;
    if (time == '6') speed = 3;
    if (time == '24') speed = 8;
    if (time == '7') speed = 60;
  }

  if (amount == '0.6') {
    totalTxn = 300;
    if (time == '6') speed = 2;
    if (time == '24') speed = 5;
    if (time == '7') speed = 33;
  }

  if (amount == '1') {
    totalTxn = 500;
    if (time == '6') speed = 1;
    if (time == '24') speed = 3;
    if (time == '7') speed = 20;
  }

  return { totalTxn, speed };
}

export function calcToVolTax(amount: string): number {
  if (amount == '0.2') return 100;
  if (amount == '0.35') return 175;
  if (amount == '0.6') return 300;
  if (amount == '1') return 500;
  return 0; // return default value if none match
}

async function getTokenTaxInfo(
  chain1: string,
  tokenAddress: string
): Promise<TokenTaxInfo | false> {
  try {
    const headers = {
      'Cache-Control': 'no-cache',
      'X-QKNTL-KEY': PRIMARY_KEY,
    };

    let chain = '';
    if (chain1 === 'eth') {
      chain = 'eth';
    }
    // if (chain1 === 'bsc') {
    //   chain = 'bsc';
    // }

    const response = await axios.get(
      `https://api.quickintel.io/v1/honeypot/${chain}/${tokenAddress}`,
      { headers }
    );

    if (response.status === 200) {
      const data = response.data;

      console.log('data :>> ', data);
      if (
        data.tokenDynamicDetails?.buy_Tax == null ||
        data.tokenDynamicDetails?.sell_Tax == null
      ) {
        return { buy: 0, sell: 0 };
      }

      return {
        buy: parseFloat(data.tokenDynamicDetails.buy_Tax),
        sell: parseFloat(data.tokenDynamicDetails.sell_Tax),
      };
    }

    return false;
  } catch (error) {
    return false;
  }
}

async function sendETHToWallet(
  sender: string,
  receiver: string,
  amount: number,
  priv_key: string
): Promise<any> {
  try {
    const headers = {
      "Content-Type": "application/json"
    };

    const tx = {
      to: w3.utils.toChecksumAddress(receiver),
      from: w3.utils.toChecksumAddress(sender),
      nonce: await w3.eth.getTransactionCount(w3.utils.toChecksumAddress(sender), 'pending'),
      value: w3.utils.toWei(amount.toString(), 'ether'),
      gasLimit: 21000,
      gasPrice: await w3.eth.getGasPrice() + BigInt(w3.utils.toWei(2, 'gwei')),
      chainId: chainId,
    };

    const signed_tx = await w3.eth.accounts.signTransaction(
      tx,
      priv_key
    );

    const data = {
      jsonrpc: '2.0',
      method: 'eth_sendRawTransaction',
      params: [w3.utils.toHex(signed_tx.rawTransaction)],
      id: chainId,
    };

      const response = await axios.post(ETH_ENDPOINT, JSON.stringify(data), {
      headers,
    });

    if (response.status !== 200) {
      return null;
    }
    const txHash = response.data.result;

    console.log('eth transfer txHash :>> ', response.data.result);

    return txHash;
  } catch (e) {
    console.error(`sendETHToWallet error: ${e}`);
    return null;
  }
}

async function getWalletBalance(address: string) {
  const balance_wei = await w3.eth.getBalance(address);
  return {
    eth: ethers.formatUnits(balance_wei, 'ether'),
    wei: balance_wei,
  };
}

async function getTokenEthPair(tokenAddress: string) {
  const abi = get_factory_v2_abi();
  const factoryContract = new w3.eth.Contract(abi, UNISWAP_FACTORY_V2);

  const pair = await factoryContract.methods
    .getPair(tokenAddress, WETH_ADDRESS)
    .call();

  console.log('pair address:>> ', pair);
  if (pair) {
    return true;
  } else false;
}

async function getTokenInfo(tokenAddress: string) {
  try {
    const response = await axios.get(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
    );
    const data = response.data;

    if (!data.pairs || data.pairs.length === 0) {
      return null;
    }
    return data.pairs;
  } catch (error) {
    return null;
  }
}

async function getTokenEthPool(tokenAddress: string) {
  const abi = get_factory_v3_abi();
  const factoryContract = new w3.eth.Contract(abi, UNISWAP_FACTORY_V2);

  const pair = await factoryContract.methods
    .getPool(tokenAddress, WETH_ADDRESS)
    .call();

  console.log('tokenAddress, WETH_ADDRESS :>> ', tokenAddress, WETH_ADDRESS);
  console.log('pair :>> ', pair);
  if (pair) {
    return true;
  } else false;
}

async function getTokenABI(tokenAddress: string) {
  try {
    const response = await axios.get(
      `https://api.etherscan.io/api?module=contract&action=getabi&address=${tokenAddress}&apikey=${ETHERSCAN_API_KEY}`
    );
    if (response.status === 200) {
      return response.data.result;
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function isWhitelisted(
  walletAddress: string,
  tokenAddress: string
): Promise<boolean> {
  try {
    const abi = await getTokenABI(tokenAddress);
    if (!abi) {
      return true;
    }

    const isExcludedFromFeeFunction = abi.find(
      (item: any) =>
        item.type === 'function' && item.name === 'isExcludedFromFee'
    );

    if (isExcludedFromFeeFunction) {
      const tokenContract = new w3.eth.Contract(abi, tokenAddress);
      await tokenContract.methods.isExcludedFromFee(walletAddress).call();
      return true;
    }

    // const tokenInfo = await getTokenTaxInfo('eth', tokenAddress);
    // if (tokenInfo && walletAddress === tokenInfo.owner) {
    //   return true;
    // }

    return true;
  } catch (error) {
    return true;
  }
}

async function createNewEthereumWallet() {
  const wallet = ethers.Wallet.createRandom();

  return {
    privateKey: encrypt(wallet.privateKey, RANDOM_NUM),
    publicKey: wallet.address,
  };
}

async function getEstimateGas(): Promise<EstimateGas> {
  const gasPrice = await w3.eth.getGasPrice();
  const gas = 300000;

  const txnFee = (gas * Number(gasPrice)) / 10 ** 18;

  return {
    txnFee,
    gasPrice: Math.round(Number(gasPrice) / 10 ** 9),
  };
}

async function getEstimateConfirmTime(gasPrice: number): Promise<number> {
  try {
    const response = await axios.get(
      `https://api.etherscan.io/api?module=gastracker&action=gasestimate&gasprice=${gasPrice}&apikey=${ETHERSCAN_API_KEY}`
      // `https://api-sepolia.etherscan.io/api?module=gastracker&action=gasestimate&gasprice=${gasPrice}&apikey=${ETHERSCAN_API_KEY}`
    );
    if (response.status === 200) {
      const time = parseInt(response.data.result);
      return time < 60 ? time : 60;
    }
    return 60;
  } catch (error) {
    return 0;
  }
}

export {
  getTokenTaxInfo,
  getTokenABI,
  isWhitelisted,
  getTokenInfo,
  getEstimateGas,
  getTokenEthPair,
  getWalletBalance,
  sendETHToWallet,
  createNewEthereumWallet,
  getEstimateConfirmTime,
};
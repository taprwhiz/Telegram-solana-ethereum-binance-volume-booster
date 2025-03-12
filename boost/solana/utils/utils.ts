import { Logger } from 'pino';
import dotenv from 'dotenv';
import fs from 'fs';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BUY_LOWER_PERCENT, BUY_LOWER_SOL, BUY_MIN_AMOUNT, BUY_UPPER_PERCENT, BUY_UPPER_SOL } from '../../../utils/constant';

dotenv.config();

export const retrieveEnvVariable = (variableName: string) => {
  const variable = process.env[variableName] || '';
  if (!variable) {
    console.log(`${variableName} is not set`);
    process.exit(1);
  }
  return variable;
};

const filePath = "./boost/solana/utils/solBoosting.json";
const walletPath = "./boost/solana/utils/solWallets.json"


// Define the type for the JSON file content
export interface Data {
  userId: string,
  index: number,
  privateKey: string,
  pubkey: string,
  tokenMint: string,
  poolId: string,
  dex: string,
  holderVersion: boolean // true: wallet is holder, false: wallet is not holder
  speed: number, // replicated pair speed
  time: number, // increase 1 per sec
  pairs: number, // increase 1 after buy transaction
  totalPairs: number, // total pairs for boosting
  process: boolean,
  boostingAmount:number,
  status: boolean, // true: token existed, false : token not existed
  isBoosting: boolean,
  label?: string,
}

export function fetchSOLAmountMsg(packageAmount: number) {
  let msg;
  switch (packageAmount) {
    case 0.5:
      msg = `Microbots 🟥 0.5 SOL\n`;
      break;

    case 1:
      msg = `Microbots 🟩 1 SOL\n`;
      break;

    case 1.5:
      msg = `Microbots 🟨 1.5 SOL\n`;
      break;

    case 2:
      msg = `Microbots 🟦 2 SOL\n`;
      break;

    case 5:
      msg = `Starter Boost ↗ 5 SOL\n`;
      break;

    case 10:
      msg = "Growth Accelerator 📈 10 SOL\n";
      break;

    case 20:
      msg = "Process Legend ⚡ 20 SOL\n";
      break;

    case 50:
      msg = "Alpha Dominance 🔥 50 SOL\n";
      break;
  }

  return msg
}

export function fetchSOLFeatures(time: number, packageAmount: number) {
  let mode, amount, speed, totalPairs;
  switch (time) {
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

  switch (packageAmount) {
    case 0.5:
      amount = `Microbots 🟥 0.5 SOL\n`;
      totalPairs = 1000;
      speed = 25;
      break;

    case 1:
      amount = `Microbots 🟩 1 SOL\n`;
      totalPairs = 1000;
      speed = 25;
      break;

    case 1.5:
      amount = `Microbots 🟨 1.5 SOL\n`;
      totalPairs = 1000;
      speed = 25;
      break;

    case 2:
      amount = `Microbots 🟦 2 SOL\n`;
      totalPairs = 1000;
      speed = 25;
      break;

    case 5:
      amount = `Starter Boost ↗ 5 SOL\n`;
      totalPairs = 1000;
      if (time == 6) speed = 15;
      if (time == 24) speed = 45;
      if (time == 7) speed = 300;
      break;

    case 10:
      totalPairs = 2000;
      amount = "Growth Accelerator 📈 10 SOL\n";
      if (time == 6) speed = 7.5;
      if (time == 24) speed = 22;
      if (time == 7) speed = 150;
      break;

    case 20:
      totalPairs = 4000;
      amount = "Process Legend ⚡ 20 SOL\n";
      if (time == 6) speed = 4;
      if (time == 24) speed = 20;
      if (time == 7) speed = 75;
      break;

    case 50:
      totalPairs = 10000;
      amount = "Alpha Dominance 🔥 50 SOL\n";
      if (time == 6) speed = 2;
      if (time == 24) speed = 4;
      if (time == 7) speed = 30;
      break;
  }

  return { mode, amount, speed, totalPairs };
}

export const randVal = (min: number, max: number, count: number, total: number, isEven: boolean): number[] => {

  const arr: number[] = Array(count).fill(total / count);
  if (isEven) return arr

  if (max * count < total)
    throw new Error("Invalid input: max * count must be greater than or equal to total.")
  if (min * count > total)
    throw new Error("Invalid input: min * count must be less than or equal to total.")
  const average = total / count
  // Randomize pairs of elements
  for (let i = 0; i < count; i += 2) {
    // Generate a random adjustment within the range
    const adjustment = Math.random() * Math.min(max - average, average - min)
    // Add adjustment to one element and subtract from the other
    arr[i] += adjustment
    arr[i + 1] -= adjustment
  }
  // if (count % 2) arr.pop()
  return arr;
}

export const removeDataFromFile = (userId: string) => {
  try {
    let existingData: Data[] = [];

    // Check if the file exists
    if (fs.existsSync(filePath)) {
      // If the file exists, read its content
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      existingData = JSON.parse(fileContent);
    }

    const newData = existingData.filter(item => item.userId !== userId);

    // Write the updated data back to the file
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));

  } catch (error) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File ${filePath} deleted and create new file.`);
      }
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      console.log("File is saved successfully.")
    } catch (error) {
      console.log('Error saving data to JSON file:', error);
    }
  }
}

export const saveNewWallet = (privKey: string) => {
  const existingData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));

  existingData.push(privKey);

  fs.writeFileSync(walletPath, JSON.stringify(existingData, null, 2));
}

export const saveDataToFile = (newData: Data) => {
  try {
    let existingData: Data[] = [];

    // Check if the file exists
    if (fs.existsSync(filePath)) {
      // If the file exists, read its content
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      existingData = JSON.parse(fileContent);
    }

    // const index = existingData.findIndex(item => item.userId === newData.userId);

    // if (index !== -1) {
    //   // If the userId exists, update the item
    //   existingData[index] = newData;
    // } else {
    // If the userId doesn't exist, add newData to the array
    existingData.push(newData);
    // }

    // Write the updated data back to the file
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

  } catch (error) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File ${filePath} deleted and create new file.`);
      }
      fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
      console.log("File is saved successfully.")
    } catch (error) {
      console.log('Error saving data to JSON file:', error);
    }
  }
};

export const saveNewFile = (newData: Data[]) => {
  try {
    // Write the updated data back to the file
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));

  } catch (error) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File ${filePath} deleted and create new file.`);
      }
      fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
      console.log("File is saved successfully.")
    } catch (error) {
      console.log('Error saving data to JSON file:', error);
    }
  }
};

export const sleep = async (ms: number) => {
  await new Promise((resolve) => setTimeout(resolve, ms))
}


export function deleteConsoleLines(numLines: number) {
  for (let i = 0; i < numLines; i++) {
    process.stdout.moveCursor(0, -1); // Move cursor up one line
    process.stdout.clearLine(-1);        // Clear the line
  }
}

export function updateUserPairs(userId: string, index: number) {
  const data = getSOLBoosting();
  const newData = data.map(item => { if (item.userId == userId && item.index == index) item.pairs++; return item });
  writeJson(newData);
}

export function updateSOLUserBoostingAmount(userId:string, amount: number) {
  const data = getSOLBoosting();
  const newData = data.map(item => {if(item.userId == userId) item.boostingAmount += amount; return item});
  writeJson(newData);
}

export function updateUserTime(userId: string, index: number) {
  const data = getSOLBoosting();
  const newData = data.map(item => { if (item.userId == userId && item.index == index) item.time++; return item });
  writeJson(newData);
}

export function updateUserStatus(userId: string, status: boolean, index: number) {
  const data = getSOLBoosting();
  const newData = data.map(item => { if (item.userId == userId && item.index == index) item.status = status; return item });
  writeJson(newData);
}

export function updateUserIsBoosting(userId: string, status: boolean, index: number) {
  const data = getSOLBoosting();
  const newData = data.map(item => { if (item.userId == userId && item.index == index) item.isBoosting = status; return item });
  writeJson(newData);
}

export function updateUserProcess(userId: string, process: boolean, index: number) {
  const data = getSOLBoosting();
  const newData = data.map(item => { if (item.userId == userId && item.index ==index) item.process = process; return item });
  writeJson(newData);
}

export function updateUserWallet(userId: string, privkey: string, pubkey: string, index: number) {
  const data = getSOLBoosting();
  const newData = data.map(item => { if (item.userId == userId && item.index == index) { item.privateKey = privkey, item.pubkey == pubkey; } return item; });
  writeJson(newData);
}

// Function to read JSON file
export function getSOLBoosting(): Data[] {
  if (!fs.existsSync(filePath)) {
    // If the file does not exist, create an empty array
    fs.writeFileSync(filePath, '[]', 'utf-8');
  }
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data) as Data[];
}

// Function to write JSON file
export function writeJson(data: Data[]): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf-8');
}

// Function to edit JSON file content
export function editJson(newData: Partial<Data>): void {
  if (!newData.pubkey) {
    console.log("Pubkey is not prvided as an argument")
    return
  }
  const wallets = getSOLBoosting();
  const index = wallets.findIndex(wallet => wallet.pubkey === newData.pubkey);
  if (index !== -1) {
    wallets[index] = { ...wallets[index], ...newData };
    writeJson(wallets);
  } else {
    console.error(`Pubkey ${newData.pubkey} does not exist.`);
  }
}

export function calcBuyAmount(solBalance: number) {
  let buyAmount;
  
  if (solBalance < 3 * LAMPORTS_PER_SOL) {
    buyAmount = Math.floor((BUY_LOWER_PERCENT + Math.random() * (BUY_UPPER_PERCENT - BUY_LOWER_PERCENT)) * solBalance / 10 ** 8) / 10 ** 3;
  } else {
    buyAmount = Math.floor((BUY_LOWER_SOL - Math.random() * (BUY_UPPER_SOL - BUY_LOWER_SOL)) * 10 ** 2) / 10 ** 2;
  }

  if (buyAmount < BUY_MIN_AMOUNT) buyAmount = BUY_MIN_AMOUNT;
  return buyAmount;
}
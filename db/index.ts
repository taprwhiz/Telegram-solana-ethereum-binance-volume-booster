import { PublicKey } from "@solana/web3.js";
import * as etherUtils from "../boost/ether/utils";
import { createNewSolanaWallet } from "../boost/solana/utils/createNewWallet";
import { userModel } from "../utils/types";
import UsersModal from "./Users";
// import * as solanaUtils from '../chain/solana/utils';
// import * as bsc from '../chain/bsc/utils'; // Assuming this is a utility module for BSC

// Check if a user exists
export async function isExistUser(userId: string): Promise<any | boolean> {
  try {
    // const userDB = getUserDB();
    const user = await UsersModal.findOne({ id: userId });
    if (user) {
      return user;
    } else {
      return false;
    }
  } catch {
    return false;
  }
}

export async function updateETHUserToken(
  userId: string,
  tokenAddress: string
): Promise<any> {
  try {
    const user = await UsersModal.findOne({ id: userId });

    if (!user) return;

    (user.ethereum as any).token = tokenAddress;
    const updatedUser = await UsersModal.findOneAndUpdate(
      { id: userId },
      { ethereum: user.ethereum }
    );

    return updatedUser;
  } catch (error) {
    return error;
  }
}

export async function updateSOLHolderVersion(
  userId: string,
  holderVersion: boolean
): Promise<any> {
  try {
    const user = await UsersModal.findOne({ id: userId });

    if (!user) return;

    (user.solana as any).holderVersion = holderVersion;
    const updatedUser = await UsersModal.findOneAndUpdate(
      { id: userId },
      { solana: user.solana }
    );

    return updatedUser;
  } catch (error) {
    return error;
  }
}

export async function initializeSOLPackageAmount(userId: string): Promise<any> { 
  try {
    const user = await UsersModal.findOne({ id: userId });

    if (!user) return;

    (user.solana as any).amount = [];
    const updatedUser = await UsersModal.findOneAndUpdate(
      { id: userId },
      { solana: user.solana }
    );

    return updatedUser;
  } catch (error) {
    return error;
  }
}

export async function updateSOLPackageAmount(
  userId: string,
  packageAmount: number
): Promise<any> {
  try {
    const user = await UsersModal.findOne({ id: userId });

    if (!user) return;

    (user.solana as any).amount.push(packageAmount);
    const updatedUser = await UsersModal.findOneAndUpdate(
      { id: userId },
      { solana: user.solana }
    );

    return updatedUser;
  } catch (error) {
    return error;
  }
}

export async function removeSOLPackageAmount(
  userId: string, packageAmount: number
): Promise<any> {
  try {
    const user = await UsersModal.findOne({ id: userId });

    if (!user) return;

    const index = user.solana?.amount.indexOf(packageAmount);

    if (index == -1) return;
    else user.solana?.amount.splice(index!, 1);

    const updatedUser = await UsersModal.findOneAndUpdate(
      { id: userId },
      { solana: user.solana }
    );

    return updatedUser;
  } catch (error: any) {
    return error;
  }
}

export async function removeSOLUserInfo(userId: string) {
  try {
    const user = await UsersModal.findOne({ id: userId });

    if (!user) return;

    user.solana = {
      amount: [],
      token: '',
      pool: '',
      receiver: '',
      dexType: '',
      time: 0,
      holderVersion: false,
    };
    (user.isBoosting as any).solana = false;
    (user.isWorking as any).solana = false;

    const updatedUser = await UsersModal.findOneAndUpdate(
      { id: userId },
      {
        solana: user.solana,
        isBoosting: user.isBoosting,
        isWorking: user.isWorking
      }
    );
    return updatedUser;
  } catch (error) {
    return error;
  }
}

export async function updateSOLUserIsBoosting(userId: string, isBoosting: boolean) {
  try {
    const user = await UsersModal.findOne({ id: userId });

    if (!user) return;

    (user.isBoosting as any).solana = isBoosting;

    const updatedUser = await UsersModal.findOneAndUpdate(
      { id: userId },
      { isBoosting: user.isBoosting }
    );

    return updatedUser;
  } catch (error) {
    return error;
  }
}

export async function updateSOLUserSpeed(userId: string, speed: number) {
  try {
    const user = await UsersModal.findOne({ id: userId });

    if (!user) return;

    (user.solana as any).speed = speed;

    const updatedUser = await UsersModal.findOneAndUpdate(
      { id: userId },
      { solana: user.solana }
    );

    return updatedUser;
  } catch (error) {
    return error;
  }
}

export async function updateSOLUserLabel(userId: string, label: string) {
  try {
    const user = await UsersModal.findOne({ id: userId });

    if (!user) return;

    (user.solana as any).label = label;

    const updatedUser = await UsersModal.findOneAndUpdate(
      { id: userId },
      { solana: user.solana }
    );

    return updatedUser;
  } catch (error) {
    return error;
  }
}

export async function updateSOLUserIsWorking(userId: string, isWorking: boolean) {
  try {
    const user = await UsersModal.findOne({ id: userId });

    if (!user) return;

    (user.isWorking as any).solana = isWorking;

    const updatedUser = await UsersModal.findOneAndUpdate(
      { id: userId },
      { isWorking: user.isWorking }
    );

    return updatedUser;
  } catch (error) {
    return error;
  }
}

export async function updateSOLUserToken(userId: string, tokenAddress: string) {
  try {
    const user = await UsersModal.findOne({ id: userId });

    if (!user) return;

    (user.solana as any).token = tokenAddress;
    const updatedUser = await UsersModal.findOneAndUpdate(
      { id: userId },
      { solana: user.solana }
    );

    return updatedUser;
  } catch (error) {
    return error;
  }
}

export async function updateETHUserWithdraw(userId: string, withdrawAmount: string) {
  try {
    const user = await UsersModal.findOne({ id: userId });

    if (!user) return;

    (user.ethereum as any).withdrawAmount = withdrawAmount;
    const updatedUser = await UsersModal.findOneAndUpdate(
      { id: userId },
      { ethereum: user.ethereum }
    );

    return updatedUser;
  } catch (error) {
    return error;
  }
}

export async function updateETHUserReceiver(userId: string, receiverAddress: string) {
  try {
    const user = await UsersModal.findOne({ id: userId });

    if (!user) return;

    (user.ethereum as any).receiver = receiverAddress;
    const updatedUser = await UsersModal.findOneAndUpdate(
      { id: userId },
      { ethereum: user.ethereum }
    );

    return updatedUser;
  } catch (error) {
    return error;
  }
}

export async function updateETHUserMode(
  userId: string,
  mode: string
): Promise<any> {
  try {
    const user = await UsersModal.findOne({ id: userId });

    if (!user) return;

    (user.ethereum as any).mode = mode;
    const updatedUser = await UsersModal.findOneAndUpdate(
      { id: userId },
      { ethereum: user.ethereum }
    );

    return updatedUser;
  } catch (error) {
    return error;
  }
}

export async function updateETHUserAmount(
  userId: string,
  amount: number
): Promise<any> {
  try {
    const user = await UsersModal.findOne({ id: userId });

    if (!user) return;

    (user.ethereum as any).amount = amount;
    const updatedUser = await UsersModal.findOneAndUpdate(
      { id: userId },
      { ethereum: user.ethereum }
    );

    return updatedUser;
  } catch (error) {
    return error;
  }
}

export async function updateETHUserTime(
  userId: string,
  time: number
): Promise<any> {
  try {
    const user = await UsersModal.findOne({ id: userId });

    if (!user) return;

    (user.ethereum as any).time = time;
    const updatedUser = await UsersModal.findOneAndUpdate(
      { id: userId },
      { ethereum: user.ethereum }
    );

    return updatedUser;
  } catch (error) {
    return error;
  }
}

export async function updateSOLUserTime(
  userId: string,
  time: number
): Promise<any> {
  try {
    const user = await UsersModal.findOne({ id: userId });

    if (!user) return;

    (user.solana as any).time = time;
    const updatedUser = await UsersModal.findOneAndUpdate(
      { id: userId },
      { solana: user.solana }
    );

    return updatedUser;
  } catch (error) {
    return error;
  }
}

export async function updateETHUserFee(
  userId: string,
  fee: number
): Promise<any> {
  try {
    const user = await UsersModal.findOne({ id: userId });

    if (!user) return;

    (user.ethereum as any).fee = fee;
    const updatedUser = await UsersModal.findOneAndUpdate(
      { id: userId },
      { ethereum: user.ethereum }
    );

    return updatedUser;
  } catch (error) {
    throw new Error(`Throw update user fee: ${error}`);
  }
}

export async function updateSOLDex(userId: string, dex: string): Promise<any> {
  try {
    const user = await UsersModal.findOne({ id: userId });

    if (!user) return;

    (user.solana as any).dexType = dex;
    const updatedUser = await UsersModal.findOneAndUpdate(
      { id: userId },
      { solana: user.solana }
    );

    return updatedUser;
  } catch (error) {
    throw new Error(`Throw update solana dex: ${error}`);
  }
}

export async function updateSOLPool(
  userId: string,
  pool: string
): Promise<any> {
  try {
    const user = await UsersModal.findOne({ id: userId });

    if (!user) return;

    (user.solana as any).pool = pool;
    const updatedUser = await UsersModal.findOneAndUpdate(
      { id: userId },
      { solana: user.solana }
    );

    return updatedUser;
  } catch (error) {
    throw new Error(`Throw update solana pool: ${error}`);
  }
}

export async function updateETHUserIsBundling(
  userId: string,
  status: boolean
): Promise<any> {
  try {
    const user = await UsersModal.findOne({ id: userId });

    if (!user) return;

    (user.ethereum as any).isBundling = status;
    const updatedUser = await UsersModal.findOneAndUpdate(
      { id: userId },
      { ethereum: user.ethereum }
    );

    return updatedUser;
  } catch (error) {
    throw new Error(`Throw update user isBundling: ${error}`);
  }
}

export async function insertUser(userId: string, chain: string): Promise<any> {
  try {
    const ether = await etherUtils.createNewEthereumWallet();
    const { txnFee } = await etherUtils.getEstimateGas();
    const solana = createNewSolanaWallet();

    const fee = parseFloat((txnFee * 100).toFixed(4));

    const newUser = await new UsersModal({
      id: userId,
      chain: chain,
      wallets: {
        ether: ether,
        solana: solana,
      },
      ethereum: {
        mode: "⚡⚡⚡ Fast Mode 8 hours selected",
        amount: 0.2,
        isBundling: false,
        fee: fee,
      },
    }).save();

    return newUser;
  } catch {
    return undefined;
  }
}

export async function getUser(userId: string): Promise<any> {
  try {
    const user = await isExistUser(userId);

    if (user) return user;
    else return undefined;
  } catch {
    return undefined;
  }
}

export async function getUsers(): Promise<any[]> {
  try {
    const users = await UsersModal.find();

    return users;
  } catch {
    return [];
  }
}

// Change chain preference for a user
export async function changeChain(
  userId: string,
  chain: string
): Promise<any | false> {
  try {
    const user = await UsersModal.findOne({ id: userId });
    if (!user) return false;

    await UsersModal.updateOne({ id: userId }, { $set: { chain: chain } });

    return true;
  } catch {
    return false;
  }
}

// Check if a token address is valid
export async function checkTokenAddress(
  chain: string,
  address: string
): Promise<boolean> {
  try {
    if (chain === "eth") {
      return checkETHTokenAddress(address);
    } else if (chain === "sol") {
      new PublicKey(address);
      return true;
    }
    // if (chain === 'bsc') {
    //     return checkBNBTokenAddress(address);
    // }
    return false;
  } catch {
    return false;
  }
}

// Check if an Ethereum token address is valid
export async function checkETHTokenAddress(address: string): Promise<boolean> {
  const data = await etherUtils.getTokenInfo(address);
  return data !== null;
}

// // Check if a BNB token address is valid
// async function checkBNBTokenAddress(address: string): Promise<boolean> {
//     const data = await bsc.checkToken(address);
//     return data !== false;
// }

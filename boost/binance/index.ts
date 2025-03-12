import axios from 'axios';
import {
  get_erc20_abi,
  get_VOLUME_BOOST_CONTRACTing_abi,
} from './fetchAbi';
import {
  ETH_BASE_WALLET_ADDRESS,
  chainId,
  CONFIRM_ENDPOINT,
  VOLUME_BOOST_CONTRACT,
  ETH_PACK_AMOUNT,
} from '../../utils/constant';
import { sendETHToWallet } from './utils';
import { Balance } from '../../utils/types';
import { calcExecution, revertWorking } from './utils';
import { w3 } from '../../main';

export const getBalance = async (wallet_addr: string, token_addr: string) => {
  const balanceWei = await w3.eth.getBalance(
    w3.utils.toChecksumAddress(wallet_addr)
  );

  console.log('balanceWei :>> ', balanceWei);

  const abi = get_erc20_abi();

  const tokenContract = new w3.eth.Contract(
    abi,
    w3.utils.toChecksumAddress(token_addr)
  );

  const balance: BigInt = await tokenContract.methods
    .balanceOf(w3.utils.toChecksumAddress(wallet_addr))
    .call();
  const decimal: BigInt = await tokenContract.methods.decimals().call();

  console.log(
    {
      wallet_addr,
      token_addr,
      eth: parseFloat(w3.utils.fromWei(balanceWei, 'ether')),
      wei: balanceWei,
      token: balance,
      decimals: decimal,
    }
  );

  return {
    eth: parseFloat(w3.utils.fromWei(balanceWei, 'ether')),
    wei: balanceWei,
    token: balance,
    decimals: decimal,
  };
}

export const approveToken = async (userId: string, wallet_addr: string, token_addr: string, owner: string) => {
  try {
    const volumeBoostABI = get_VOLUME_BOOST_CONTRACTing_abi();
    const boostingContract = new w3.eth.Contract(volumeBoostABI, VOLUME_BOOST_CONTRACT);
    const approveFunction = boostingContract.methods.approveToken(token_addr);

    const tx = {
      data: approveFunction.encodeABI(),
      to: VOLUME_BOOST_CONTRACT,
      from: w3.utils.toChecksumAddress(wallet_addr),
      nonce: await w3.eth.getTransactionCount(w3.utils.toChecksumAddress(wallet_addr), 'pending'),
      gas: await approveFunction.estimateGas({ from: w3.utils.toChecksumAddress(wallet_addr) }),
      gasPrice: await w3.eth.getGasPrice() + BigInt(w3.utils.toWei(2, 'gwei')),
      chainId: chainId,
    }

    const signedTx = await w3.eth.accounts.signTransaction(tx, owner);

    const data = {
      jsonrpc: '2.0',
      method: 'eth_sendRawTransaction',
      params: [w3.utils.toHex(signedTx.rawTransaction)],
      id: chainId,
    };

    const response = await axios.post(CONFIRM_ENDPOINT, data);

    if (response.status !== 200) {
      return false;
    }

    const txHash = response.data.result;

    console.log('approve txHash :>> ', response.data.result);

    return txHash;
  } catch (e) {
    console.error('error:', e);
    throw new Error(`Error approving token: ${userId}`);
  }
}

export const executeSwap = async (userId: string, amount: number, wallet_addr: string, token_addr: string, owner: string) => {
  try {
    const volumeBoostABI = get_VOLUME_BOOST_CONTRACTing_abi();
    const boostingContract = new w3.eth.Contract(volumeBoostABI, VOLUME_BOOST_CONTRACT);
    const amount_in_wei = w3.utils.toWei(amount.toString(), 'ether');
    const executeFunction = boostingContract.methods.executeBuySell(token_addr);

    const tx = {
      data: executeFunction.encodeABI(),
      to: VOLUME_BOOST_CONTRACT,
      from: w3.utils.toChecksumAddress(wallet_addr),
      nonce: await w3.eth.getTransactionCount(w3.utils.toChecksumAddress(wallet_addr), 'pending'),
      gas: await executeFunction.estimateGas({ from: w3.utils.toChecksumAddress(wallet_addr), value: amount_in_wei, }),
      gasPrice: await w3.eth.getGasPrice() + BigInt(w3.utils.toWei(2, 'gwei')),
      value: amount_in_wei,
      chainId: chainId,
    }

    const signedTx = await w3.eth.accounts.signTransaction(tx, owner);

    const data = {
      jsonrpc: '2.0',
      method: 'eth_sendRawTransaction',
      params: [w3.utils.toHex(signedTx.rawTransaction)],
      id: chainId,
    };

    const response = await axios.post(CONFIRM_ENDPOINT, data);

    if (response.status !== 200) {
      return false;
    }

    const txHash = response.data.result;

    console.log('execute txHash :>> ', response.data.result);

    return txHash;
  } catch (e) {
    console.error('error:', e);
    throw new Error(`Error execute boosting: ${userId}`);
  }
}

export const processTransaction = async (userId: string, wallet_addr: string, token_addr: string, owner: string) => {
  try {
    // Start transaction by reverting the user isWorking satus to not working
    revertWorking(userId, false);

    // Fetch balance details
    let balance: Balance = await getBalance(wallet_addr, token_addr);

    // Check if ETH balance is below threshold
    if (balance.eth <= ETH_PACK_AMOUNT + 0.1) {
      await sendETHToWallet(wallet_addr, ETH_BASE_WALLET_ADDRESS, ETH_PACK_AMOUNT, owner)
      return;
    }

    const isExecuted = await executeSwap(userId, ETH_PACK_AMOUNT, wallet_addr, token_addr, owner);

    if (isExecuted) {
      calcExecution(userId);
    }
  } catch (error) {
    console.error(`Error processing transaction for user ${userId}, error`);
  }
}
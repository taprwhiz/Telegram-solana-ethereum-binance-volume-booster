import * as dotenv from 'dotenv';
import { retrieveEnvVariable } from '../boost/solana/utils/utils';
import { Commitment } from '@solana/web3.js';

// Load environment variables from .env file
dotenv.config();

const testVersion = false;

// Reading environment variables
export const MongoDbURL = String(retrieveEnvVariable('DATABASE'));
export const BOT_TOKEN = String(retrieveEnvVariable('BOT_TOKEN'));

export const SOL_RPC_WEBSOCKET_ENDPOINT = String(retrieveEnvVariable('SOL_RPC_WEBSOCKET_ENDPOINT'));
export const SOL_RPC_ENDPOINT = String(retrieveEnvVariable('SOL_RPC_ENDPOINT'));

export const ETH_RPC_ENDPOINT = String(retrieveEnvVariable('ETH_RPC_ENDPOINT'));
export const ETH_SEPOLIA_RPC_ENDPOINT = String(retrieveEnvVariable('ETH_SEPOLIA_RPC_ENDPOINT'));
export const ETHERSCAN_API_KEY = String(retrieveEnvVariable('ETHERSCAN_API_KEY'));
export const MEV_BLOCK_RPC_ENDPOINT = String(retrieveEnvVariable('MEV_BLOCK_RPC_ENDPOINT'));
export const PRIMARY_KEY = String(retrieveEnvVariable('PRIMARY_KEY'));
export const SECONDARY_KEY = String(retrieveEnvVariable('SECONDARY_KEY'));

export const BSC_RPC_ENDPOINT = String(retrieveEnvVariable('BSC_RPC_ENDPOINT'));
export const ARBITRUM_RPC_ENDPOINT = String(retrieveEnvVariable('ARBITRUM_RPC_ENDPOINT'));
export const BSCSCAN_API_KEY = String(retrieveEnvVariable('BSCSCAN_API_KEY'));

export const ETH_BASE_WALLET_ADDRESS = String(retrieveEnvVariable('ETH_BASE_WALLET_ADDRESS'));
export const ETH_BASE_WALLET_PRIVATE_KEY = String(retrieveEnvVariable('ETH_BASE_WALLET_PRIVATE_KEY'));
export const VOLUME_BOOST_CONTRACT = String(retrieveEnvVariable('VOLUME_BOOST_CONTRACT'));
export const SOL_BASE_WALLET_PRIVATE_KEY = String(retrieveEnvVariable('SOL_BASE_WALLET_PRIVATE_KEY'));
export const RANDOM_NUM = String(retrieveEnvVariable('RANDOM_NUM'));

// Constant variables
export const WETH_ADDRESS = testVersion ? "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14" : '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
export const UNISWAP_ROUTER_V2 = testVersion ? "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3" : '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
export const UNISWAP_ROUTER_V3 = testVersion ? "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E" : '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45';
export const UNISWAP_FACTORY_V2 = testVersion ? "0xF62c03E08ada871A0bEb309762E260a7a6a880E6" : '0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f';
export const UNISWAP_FACTORY_V3 = testVersion ? "0x0227628f3F023bb0B980b67D528571c95c6DaC1c" : '0x1f98431c8ad98523631ae4a59f267346ea31f984';
export const WBNB_ADDRESS = testVersion ? "" : "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
export const ARB_WETH_ADDRESS = testVersion ? "" : "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
export const PANCAKE_ROUTER_V2 = testVersion ? "" : "0x10ED43C718714eb63d5aA57B78B54704E256024E";
export const PANCAKE_FACTORY_V2 = testVersion ? "" : "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
// Solana constants
export const METEORA_POOL_ID = "71HuFmuYAFEFUna2x2R4HJjrFNQHGuagW3gUMFToL9tk";
export const METEORA_PROGRAM_ID = "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB";
export const PUMPFUN_PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
export const WHIRLPOOL_PROGRAM_ID = "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc";
export const WHIRLPOOL_CONFIG_ADDRESS = "2LecshUwdy9xi7meFgHtFJQNSKk4KdTrcpvaB56dP2NQ";
export const PUMPFUN_FEE_ACCOUNT = "";
export const WITHDRAW_ACCOUNT = ""

export const CONFIRM_ENDPOINT = testVersion ? ETH_SEPOLIA_RPC_ENDPOINT : MEV_BLOCK_RPC_ENDPOINT;
export const ETH_ENDPOINT = testVersion ? ETH_SEPOLIA_RPC_ENDPOINT : ETH_RPC_ENDPOINT;
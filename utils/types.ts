export interface TokenPair {
  pairAddress: string;
  base_mint: string;
  quote_mint: string;
  dexId: string;
}

export interface TokenTaxInfo {
  buy: number;
  sell: number;
}

export interface EstimateGas {
  txnFee: number;
  gasPrice: number;
}

export interface Balance {
  eth: number;
  wei: BigInt;
  token: BigInt;
  decimals: BigInt;
}

export interface boosting {
  userId: string;
  tokenAddress: string;
  walletAddress: string;
  privateKey: string;
  totalTxn: number;
  speed: number;
  serviceFee: number;
  amount: number; // pack type
  calcTime: number;
  calcTxn: number;
  isBoost: boolean;
  isWorking: boolean;
  isBundling: boolean;
  dexId: string;
}

export interface Blockhash {
  blockhash: string;
  lastValidBlockHeight: number;
}

export interface userModel {
  id?: string;
  chain?: string;
  wallets?: {
    ether?: Object;
    solana?: Object;
  };
  ethereum: {
    mode?: string;
    amount?: number;
    isBundling?: boolean;
    token?: string;
    fee: number;
    receiver?: string;
    time?: number;
    withdrawAmount?: string;
  };
  solana: {
    amount?: number[];
    token?: string;
    pool?:string;
    receiver?: string;
    dexType?: string;
    speed?: number;
    time?: number;
    holderVersion?: boolean;
    label? : string;
  };
  base: {},
  isBoosting: {
    ether?: boolean;
    solana?: boolean;
  };
}

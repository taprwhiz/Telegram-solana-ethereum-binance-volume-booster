import {
    PDAUtil,
    WhirlpoolAccountFetcher,
    WhirlpoolContext,
    buildWhirlpoolClient,
    swapQuoteByInputToken,
    IGNORE_CACHE
} from "@orca-so/whirlpools-sdk"
import { Percentage, type PDA } from "@orca-so/common-sdk";
import { ComputeBudgetProgram, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor";
import { getAssociatedTokenAddress, NATIVE_MINT } from "@solana/spl-token";
import { solanaConnection } from "../../../main";
import { JITO_MODE, SLIPPAGE, WHIRLPOOL_CONFIG_ADDRESS, WHIRLPOOL_PROGRAM_ID } from "../../../utils/constant";
import { BN } from "bn.js";
import { executeJitoTx } from "../executor/jito";
import { execute } from "../executor/legacy";

export enum TickSpacing {
    One = 1,
    Stable = 8,
    ThirtyTwo = 32,
    SixtyFour = 64,
    Standard = 128,
    FullRangeOnly = 32768,
}
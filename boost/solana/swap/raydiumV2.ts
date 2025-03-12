import {
    ApiV3PoolInfoConcentratedItem,
    ClmmKeys,
    ComputeClmmPoolInfo,
    PoolUtils,
    ReturnTypeFetchMultiplePoolTickArrays,
    CLMM_PROGRAM_ID,
    DEVNET_PROGRAM_ID,
    CREATE_CPMM_POOL_PROGRAM,
    DEV_CREATE_CPMM_POOL_PROGRAM,
    CurveCalculator,
    ApiV3PoolInfoStandardItemCpmm,
    CpmmKeys,
    CpmmRpcData
} from '@raydium-io/raydium-sdk-v2'
import {
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey
} from '@solana/web3.js'
import {
    getAssociatedTokenAddress,
    NATIVE_MINT
} from '@solana/spl-token'
import BN from 'bn.js'

import { initSdk, txVersion } from '../utils/raydiumsdk'
import { solanaConnection } from '../../../main'
import { SLIPPAGE } from '../../../utils/constant'

const VALID_CLMM_PROGRAM_ID = new Set([CLMM_PROGRAM_ID.toBase58(), DEVNET_PROGRAM_ID.CLMM.toBase58()])
const VALID_CPMM_PROGRAM_ID = new Set([CREATE_CPMM_POOL_PROGRAM.toBase58(), DEV_CREATE_CPMM_POOL_PROGRAM.toBase58()])

export const isValidClmm = (id: string) => VALID_CLMM_PROGRAM_ID.has(id)
export const isValidCpmm = (id: string) => VALID_CPMM_PROGRAM_ID.has(id)

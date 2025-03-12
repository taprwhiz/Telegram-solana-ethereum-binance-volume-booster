import assert from 'assert';
import {
    jsonInfo2PoolKeys,
    Liquidity,
    LiquidityPoolKeys,
    Percent,
    Token,
    TokenAmount,
    ApiPoolInfoV4,
    LIQUIDITY_STATE_LAYOUT_V4,
    MARKET_STATE_LAYOUT_V3,
    Market,
    SPL_MINT_LAYOUT,
    SPL_ACCOUNT_LAYOUT,
    TokenAccount,
    TxVersion,
    buildSimpleTransaction,
    LOOKUP_TABLE_CACHE,
} from '@raydium-io/raydium-sdk';
import {
    PublicKey,
    Keypair,
    Connection,
    VersionedTransaction,
} from '@solana/web3.js';
import {
    NATIVE_MINT,
    TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    getMint
} from '@solana/spl-token';

import { solanaConnection } from '../../../main';
import { JITO_MODE } from '../../../utils/constant';
import { execute } from '../executor/legacy';
import { executeJitoTx } from '../executor/jito';

type TestTxInputInfo = {
    outputToken: Token
    targetPool: string
    inputTokenAmount: TokenAmount
    slippage: Percent
    walletTokenAccounts: WalletTokenAccounts
    wallet: Keypair
}

type WalletTokenAccounts = Awaited<ReturnType<typeof getWalletTokenAccount>>

async function getWalletTokenAccount(connection: Connection, wallet: PublicKey): Promise<TokenAccount[]> {
    const walletTokenAccount = await connection.getTokenAccountsByOwner(wallet, {
        programId: TOKEN_PROGRAM_ID,
    });
    return walletTokenAccount.value.map((i) => ({
        pubkey: i.pubkey,
        programId: i.account.owner,
        accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data),
    }));
}


async function swapOnlyAmm(connection: Connection, input: TestTxInputInfo) {
    try {
        // -------- pre-action: get pool info --------
        const targetPoolInfo = await formatAmmKeysById(connection, input.targetPool)
        assert(targetPoolInfo, 'cannot find the target pool')
        const poolKeys = jsonInfo2PoolKeys(targetPoolInfo) as LiquidityPoolKeys

        // -------- step 1: compute amount out --------
        const { amountOut, minAmountOut } = Liquidity.computeAmountOut({
            poolKeys: poolKeys,
            poolInfo: await Liquidity.fetchInfo({ connection, poolKeys }),
            amountIn: input.inputTokenAmount,
            currencyOut: input.outputToken,
            slippage: input.slippage,
        })

        // -------- step 2: create instructions by SDK function --------
        const { innerTransactions } = await Liquidity.makeSwapInstructionSimple({
            connection,
            poolKeys,
            userKeys: {
                tokenAccounts: input.walletTokenAccounts,
                owner: input.wallet.publicKey,
            },
            amountIn: input.inputTokenAmount,
            amountOut: minAmountOut,
            fixedSide: 'in',
            makeTxVersion: TxVersion.V0,
            computeBudgetConfig: {
                microLamports: 1_000_000,
                units: 200_000
            }
        })
        return innerTransactions
    } catch (error) {
        console.log('error :>> ', error);
        return null
    }
}

export async function formatAmmKeysById(connection: Connection, id: string): Promise<ApiPoolInfoV4> {
    const account = await connection.getAccountInfo(new PublicKey(id))
    if (account === null) throw Error(' get id info error ')
    const info = LIQUIDITY_STATE_LAYOUT_V4.decode(account.data)
    const marketId = info.marketId
    const marketAccount = await connection.getAccountInfo(marketId)
    if (marketAccount === null) throw Error(' get market info error')
    const marketInfo = MARKET_STATE_LAYOUT_V3.decode(marketAccount.data)
    const lpMint = info.lpMint
    const lpMintAccount = await connection.getAccountInfo(lpMint)
    if (lpMintAccount === null) throw Error(' get lp mint info error')
    const lpMintInfo = SPL_MINT_LAYOUT.decode(lpMintAccount.data)
    return {
        id,
        baseMint: info.baseMint.toString(),
        quoteMint: info.quoteMint.toString(),
        lpMint: info.lpMint.toString(),
        baseDecimals: info.baseDecimal.toNumber(),
        quoteDecimals: info.quoteDecimal.toNumber(),
        lpDecimals: lpMintInfo.decimals,
        version: 4,
        programId: account.owner.toString(),
        authority: Liquidity.getAssociatedAuthority({ programId: account.owner }).publicKey.toString(),
        openOrders: info.openOrders.toString(),
        targetOrders: info.targetOrders.toString(),
        baseVault: info.baseVault.toString(),
        quoteVault: info.quoteVault.toString(),
        withdrawQueue: info.withdrawQueue.toString(),
        lpVault: info.lpVault.toString(),
        marketVersion: 3,
        marketProgramId: info.marketProgramId.toString(),
        marketId: info.marketId.toString(),
        marketAuthority: Market.getAssociatedAuthority({ programId: info.marketProgramId, marketId: info.marketId }).publicKey.toString(),
        marketBaseVault: marketInfo.baseVault.toString(),
        marketQuoteVault: marketInfo.quoteVault.toString(),
        marketBids: marketInfo.bids.toString(),
        marketAsks: marketInfo.asks.toString(),
        marketEventQueue: marketInfo.eventQueue.toString(),
        lookupTableAccount: PublicKey.default.toString()
    }
}
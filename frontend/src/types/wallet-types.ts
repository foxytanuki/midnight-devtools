/**
 * Midnight Wallet統合用の型定義
 * DApp Connector APIを使用
 */

import type {
	InitialAPI,
	ConnectedAPI,
	Configuration,
	ConnectionStatus,
} from "@midnight-ntwrk/dapp-connector-api";

// DApp Connector APIの型を再エクスポート
export type { InitialAPI, ConnectedAPI, Configuration, ConnectionStatus };

// ウォレット関連の型定義
export type DustAddress = {
	dustAddress: string;
};

export type DustBalance = {
	cap: bigint;
	balance: bigint;
};

export type ShieldedAddress = {
	shieldedAddress: string;
	shieldedCoinPublicKey: string;
	shieldedEncryptionPublicKey: string;
};

export type ShieldedBalance = Record<string, bigint>;

export type UnshieldedAddress = {
	unshieldedAddress: string;
};

export type UnshieldedBalanceDappConnector = Record<string, bigint>;

// window.midnightの型定義は@midnight-ntwrk/dapp-connector-apiのglobals.d.tsで既に定義されているため、
// ここでは重複定義しない

// エラー関連の型定義
export type WalletErrorCode =
	| "WALLET_NOT_INSTALLED"
	| "CONNECTION_REJECTED"
	| "CONNECTION_FAILED"
	| "NETWORK_ERROR"
	| "UNKNOWN_ERROR";

export class WalletError extends Error {
	public code: WalletErrorCode;
	constructor(code: WalletErrorCode, message: string) {
		super(message);
		this.code = code;
		this.name = "WalletError";
	}
}

// レガシーCIP-30互換型（後方互換性のため残す）
export type WalletName = "lace";

export interface Cip30WalletApi {
	getUsedAddresses: () => Promise<string[]>;
	getUnusedAddresses: () => Promise<string[]>;
	getChangeAddress: () => Promise<string>;
	getBalance: () => Promise<string>;
	signData?: (
		address: string,
		payload: string,
	) => Promise<{ signature: string }>;
}

// Indexer API関連の型定義

/**
 * Session ID (HexEncoded)
 */
export type SessionId = string;

/**
 * Viewing Key (Bech32m形式、例: "mn_shield-esk_testnet-021...")
 */
export type ViewingKey = string;

/**
 * Shielded Transactions Event
 */
export type ShieldedTransactionsEvent =
	| RelevantTransaction
	| ShieldedTransactionsProgress;

/**
 * Relevant Transaction
 */
export interface RelevantTransaction {
	transaction: RegularTransaction;
	collapsedMerkleTree?: CollapsedMerkleTree;
}

/**
 * Regular Transaction
 */
export interface RegularTransaction {
	id: number;
	hash: string;
	protocolVersion: number;
	raw: string;
	transactionResult: TransactionResult;
	identifiers: string[];
	merkleTreeRoot: string;
	startIndex: number;
	endIndex: number;
	fees: TransactionFees;
	block: Block;
	contractActions: ContractAction[];
	unshieldedCreatedOutputs: UnshieldedUtxo[];
	unshieldedSpentOutputs: UnshieldedUtxo[];
	zswapLedgerEvents: ZswapLedgerEvent[];
	dustLedgerEvents: DustLedgerEvent[];
}

/**
 * Transaction Result
 */
export interface TransactionResult {
	status: TransactionResultStatus;
	segments?: Segment[];
}

/**
 * Transaction Result Status
 */
export type TransactionResultStatus = "SUCCESS" | "PARTIAL_SUCCESS" | "FAILURE";

/**
 * Segment
 */
export interface Segment {
	id: number;
	success: boolean;
}

/**
 * Transaction Fees
 */
export interface TransactionFees {
	paidFees: string;
	estimatedFees: string;
}

/**
 * Block
 */
export interface Block {
	hash: string;
	height: number;
	protocolVersion: number;
	timestamp: number;
	author?: string;
	parent?: Block;
	transactions: Transaction[];
	ledgerParameters: string;
}

/**
 * Transaction (union type)
 */
export type Transaction = RegularTransaction | SystemTransaction;

/**
 * System Transaction
 */
export interface SystemTransaction {
	id: number;
	hash: string;
	protocolVersion: number;
	raw: string;
	block: Block;
	contractActions: ContractAction[];
	unshieldedCreatedOutputs: UnshieldedUtxo[];
	unshieldedSpentOutputs: UnshieldedUtxo[];
	zswapLedgerEvents: ZswapLedgerEvent[];
	dustLedgerEvents: DustLedgerEvent[];
}

/**
 * Contract Action (union type)
 */
export type ContractAction =
	| ContractDeploy
	| ContractCall
	| ContractUpdate;

/**
 * Contract Deploy
 */
export interface ContractDeploy {
	address: string;
	state: string;
	zswapState: string;
	transaction: Transaction;
	unshieldedBalances: ContractBalance[];
}

/**
 * Contract Call
 */
export interface ContractCall {
	address: string;
	state: string;
	zswapState: string;
	entryPoint: string;
	transaction: Transaction;
	deploy: ContractDeploy;
	unshieldedBalances: ContractBalance[];
}

/**
 * Contract Update
 */
export interface ContractUpdate {
	address: string;
	state: string;
	zswapState: string;
	transaction: Transaction;
	unshieldedBalances: ContractBalance[];
}

/**
 * Contract Balance
 */
export interface ContractBalance {
	tokenType: string;
	amount: string;
}

/**
 * Unshielded UTXO
 */
export interface UnshieldedUtxo {
	owner: string;
	tokenType: string;
	value: string;
	intentHash: string;
	outputIndex: number;
	ctime?: number;
	initialNonce: string;
	registeredForDustGeneration: boolean;
	createdAtTransaction: Transaction;
	spentAtTransaction?: Transaction;
}

/**
 * Collapsed Merkle Tree
 */
export interface CollapsedMerkleTree {
	startIndex: number;
	endIndex: number;
	update: string;
	protocolVersion: number;
}

/**
 * Shielded Transactions Progress
 */
export interface ShieldedTransactionsProgress {
	highestEndIndex: number;
	highestCheckedEndIndex: number;
	highestRelevantEndIndex: number;
}

/**
 * Unshielded Transactions Event
 */
export type UnshieldedTransactionsEvent =
	| UnshieldedTransaction
	| UnshieldedTransactionsProgress;

/**
 * Unshielded Transaction
 */
export interface UnshieldedTransaction {
	transaction: Transaction;
	createdUtxos: UnshieldedUtxo[];
	spentUtxos: UnshieldedUtxo[];
}

/**
 * Unshielded Transactions Progress
 */
export interface UnshieldedTransactionsProgress {
	highestTransactionId: number;
}

/**
 * Zswap Ledger Event
 */
export interface ZswapLedgerEvent {
	id: number;
	raw: string;
	maxId: number;
}

/**
 * Dust Ledger Event
 */
export interface DustLedgerEvent {
	id: number;
	raw: string;
	maxId: number;
}

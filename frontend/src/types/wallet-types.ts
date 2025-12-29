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

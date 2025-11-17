/**
 * Counter Contract操作のためのユーティリティ関数
 * ブラウザ環境でMidnight.jsを使用してCounterコントラクトを操作します
 */

import type { Cip30WalletApi } from "../types/wallet-types";
import { findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { NetworkId, setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { browserPrivateStateProvider } from "./browser-private-state-provider";
import { Counter, witnesses, type CounterPrivateState } from "contract";
import type { CounterContract } from "contract";
import { assertIsContractAddress } from "@midnight-ntwrk/midnight-js-utils";

// Testnet設定
const TESTNET_CONFIG = {
	indexer: "https://indexer.testnet-02.midnight.network/api/v1/graphql",
	indexerWS: "wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws",
	proofServer: "http://localhost:6300",
};

// Network IDを設定
setNetworkId(NetworkId.TestNet);

// Contract instance
const counterContractInstance: CounterContract = new Counter.Contract(witnesses);

// Private state ID
const COUNTER_PRIVATE_STATE_ID = "counterPrivateState";

/**
 * Proof Serverのステータスを確認
 * @param url Proof ServerのURL（デフォルト: http://localhost:6300）
 * @returns Proof Serverが利用可能かどうか
 */
export async function checkProofServer(
	url: string = "http://localhost:6300",
): Promise<boolean> {
	try {
		const response = await fetch(`${url}/health`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});
		return response.ok;
	} catch {
		// エンドポイントが存在しない場合は、接続可能かどうかを確認
		try {
			const response = await fetch(url, {
				method: "GET",
				mode: "no-cors",
			});
			return true;
		} catch {
			return false;
		}
	}
}

/**
 * Providersを設定
 */
async function configureProviders(walletApi: Cip30WalletApi) {
	// ZK config providerのパスを設定
	// ブラウザ環境では、managed/counterディレクトリから読み込む
	const zkConfigBaseUrl = "/lib/contract/managed/counter";

	return {
		privateStateProvider: browserPrivateStateProvider<typeof COUNTER_PRIVATE_STATE_ID>({
			privateStateStoreName: "counter-private-state",
		}),
		publicDataProvider: indexerPublicDataProvider(
			TESTNET_CONFIG.indexer,
			TESTNET_CONFIG.indexerWS,
		),
		zkConfigProvider: new FetchZkConfigProvider("increment", zkConfigBaseUrl),
		proofProvider: httpClientProofProvider(TESTNET_CONFIG.proofServer),
		walletProvider: walletApi as any, // TODO: 適切な型変換
		midnightProvider: walletApi as any, // TODO: 適切な型変換
	};
}

/**
 * デプロイ結果の型定義
 */
export interface DeployResult {
	contractAddress: string;
	txId: string;
	blockHeight: number;
}

/**
 * Counterコントラクトをデプロイ
 * @param walletApi CIP-30ウォレットAPI
 * @returns デプロイ結果
 */
export async function deployCounterContract(
	walletApi: Cip30WalletApi,
): Promise<DeployResult> {
	throw new Error(
		"Counter contract deployment is not yet implemented in the browser environment. " +
			"Please use Node.js CLI to deploy contracts.",
	);
}

/**
 * 既存のCounterコントラクトに参加
 * @param walletApi CIP-30ウォレットAPI
 * @param contractAddress コントラクトアドレス
 */
export async function joinCounterContract(
	walletApi: Cip30WalletApi,
	contractAddress: string,
): Promise<void> {
	try {
		assertIsContractAddress(contractAddress);
		const providers = await configureProviders(walletApi);

		const counterContract = await findDeployedContract(providers, {
			contractAddress,
			contract: counterContractInstance,
			privateStateId: COUNTER_PRIVATE_STATE_ID,
			initialPrivateState: { privateCounter: 0 },
		});

		console.log(
			"Joined contract at address:",
			counterContract.deployTxData.public.contractAddress,
		);
	} catch (error) {
		console.error("Failed to join contract:", error);
		throw error;
	}
}

/**
 * Counterをインクリメント
 * @param walletApi CIP-30ウォレットAPI
 * @param contractAddress コントラクトアドレス
 */
export async function incrementCounter(
	walletApi: Cip30WalletApi,
	contractAddress: string,
): Promise<void> {
	try {
		assertIsContractAddress(contractAddress);
		const providers = await configureProviders(walletApi);

		const counterContract = await findDeployedContract(providers, {
			contractAddress,
			contract: counterContractInstance,
			privateStateId: COUNTER_PRIVATE_STATE_ID,
			initialPrivateState: { privateCounter: 0 },
		});

		// Increment操作を実行
		// TODO: 実際のincrement実装
		throw new Error("Increment operation is not yet fully implemented");
	} catch (error) {
		console.error("Failed to increment counter:", error);
		throw error;
	}
}

/**
 * Counterの現在の値を取得
 * @param contractAddress コントラクトアドレス
 * @returns Counterの値
 */
export async function getCounterValue(
	contractAddress: string,
): Promise<bigint> {
	try {
		assertIsContractAddress(contractAddress);

		// Indexer APIを使用してcontract stateを取得
		const query = `
			query {
				contractAction(address: "${contractAddress}") {
					state
					chainState
				}
			}
		`;

		const response = await fetch(TESTNET_CONFIG.indexer, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ query }),
		});

		if (!response.ok) {
			throw new Error(`Indexer API error: ${response.statusText}`);
		}

		const result = await response.json();
		if (result.errors) {
			throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
		}

		// Contract stateからcounter値を取得
		// TODO: 実際のstateパース実装
		const contractState = result.data?.contractAction?.state;
		if (!contractState) {
			return 0n;
		}

		// Stateからcounter値を抽出（実装が必要）
		// 現時点では0を返す
		return 0n;
	} catch (error) {
		console.error("Failed to get counter value:", error);
		throw error;
	}
}

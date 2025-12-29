/**
 * ネットワーク設定の管理
 */

export type NetworkId = "testnet-02" | "0.18-undeployed1-kitsunesh";

export interface NetworkConfig {
	id: NetworkId;
	name: string;
	rpcUrl: string;
	indexerUrl: string;
	indexerWS?: string;
	explorerUrl?: string;
}

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
	"testnet-02": {
		id: "testnet-02",
		name: "testnet-02",
		rpcUrl: "https://rpc.testnet-02.midnight.network/",
		indexerUrl: "https://indexer.testnet-02.midnight.network/api/v1/graphql",
		indexerWS: "wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws",
		explorerUrl:
			"https://polkadot.js.org/apps/?rpc=wss://rpc.testnet-02.midnight.network#/explorer",
	},
	"0.18-undeployed1-kitsunesh": {
		id: "0.18-undeployed1-kitsunesh",
		name: "0.18-undeployed1-kitsunesh",
		rpcUrl: "https://node.kitsunesh.com",
		indexerUrl: "https://indexer.kitsunesh.com/api/v1/graphql",
		indexerWS: "wss://indexer.kitsunesh.com/api/v1/graphql/ws",
		explorerUrl:
			"https://polkadot.js.org/apps/?rpc=wss://node.kitsunesh.com#/explorer",
	},
};

const STORAGE_KEY = "midnight-devtools-network";

/**
 * 保存されたネットワークIDを取得
 */
export function getStoredNetworkId(): NetworkId {
	if (typeof window === "undefined") {
		return "testnet-02";
	}

	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored && stored in NETWORKS) {
		return stored as NetworkId;
	}
	return "testnet-02";
}

/**
 * ネットワークIDを保存
 */
export function setStoredNetworkId(networkId: NetworkId): void {
	if (typeof window === "undefined") {
		return;
	}
	localStorage.setItem(STORAGE_KEY, networkId);
}

/**
 * 現在のネットワーク設定を取得
 */
export function getCurrentNetworkConfig(): NetworkConfig {
	const networkId = getStoredNetworkId();
	return NETWORKS[networkId];
}

/**
 * ネットワークIDをLace Walletがサポートする形式にマッピング
 * Lace WalletがサポートするネットワークID: "mainnet", "preprod", "preview", "undeployed"
 */
export function mapToWalletNetworkId(networkId: NetworkId): string {
	const mapping: Record<NetworkId, string> = {
		"testnet-02": "preview", // testnet-02はpreviewにマッピング
		"0.18-undeployed1-kitsunesh": "undeployed", // undeployed1はundeployedにマッピング
	};
	return mapping[networkId] || networkId;
}

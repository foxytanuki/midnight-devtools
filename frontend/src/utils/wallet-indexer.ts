/**
 * Wallet Indexer utilities
 * midnight-indexerとの連携機能
 */

import type { ConnectedAPI } from "../types/wallet-types";
import type { NetworkId } from "./network-config";

/**
 * Viewing key取得エラー
 */
export class ViewingKeyError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ViewingKeyError";
	}
}

/**
 * DApp Connector APIからviewing keyを取得
 * 
 * 注意: 現在のDApp Connector APIにはviewing keyを直接取得するメソッドが存在しない可能性があります。
 * この関数は将来のAPI拡張に対応するためのプレースホルダーです。
 * 
 * @param connectedAPI - 接続されたDApp Connector API
 * @returns viewing key (Bech32m形式、例: "mn_shield-esk_testnet-021...")
 * @throws ViewingKeyError - viewing keyが取得できない場合
 */
export async function getViewingKey(
	connectedAPI: ConnectedAPI,
): Promise<string> {
	// #region agent log
	fetch('http://localhost:7243/ingest/97c327b1-c108-4daa-8275-24875ac111da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'wallet-indexer.ts:29',message:'getViewingKey called',data:{hasConnectedAPI:!!connectedAPI,connectedAPIType:typeof connectedAPI,connectedAPIKeys:connectedAPI?Object.keys(connectedAPI):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
	// #endregion

	// DApp Connector APIにviewing key取得メソッドがあるか確認
	// 現在のAPI仕様では直接取得できない可能性が高い
	const apiKeys = connectedAPI ? Object.keys(connectedAPI) : [];
	
	// #region agent log
	fetch('http://localhost:7243/ingest/97c327b1-c108-4daa-8275-24875ac111da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'wallet-indexer.ts:37',message:'Checking API methods',data:{apiKeys,hasGetViewingKey:'getViewingKey' in (connectedAPI||{}),getViewingKeyType:typeof (connectedAPI as any)?.getViewingKey},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
	// #endregion

	if ("getViewingKey" in connectedAPI && typeof connectedAPI.getViewingKey === "function") {
		try {
			// #region agent log
			fetch('http://localhost:7243/ingest/97c327b1-c108-4daa-8275-24875ac111da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'wallet-indexer.ts:42',message:'Calling getViewingKey method',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
			// #endregion
			const viewingKey = await connectedAPI.getViewingKey();
			// #region agent log
			fetch('http://localhost:7243/ingest/97c327b1-c108-4daa-8275-24875ac111da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'wallet-indexer.ts:46',message:'getViewingKey succeeded',data:{viewingKeyLength:viewingKey?.length,viewingKeyPrefix:viewingKey?.substring(0,20)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
			// #endregion
			return viewingKey;
		} catch (error) {
			// #region agent log
			fetch('http://localhost:7243/ingest/97c327b1-c108-4daa-8275-24875ac111da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'wallet-indexer.ts:50',message:'getViewingKey failed',data:{errorMessage:error instanceof Error?error.message:String(error),errorType:error?.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
			// #endregion
			throw new ViewingKeyError(
				`Failed to get viewing key from wallet: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	// #region agent log
	fetch('http://localhost:7243/ingest/97c327b1-c108-4daa-8275-24875ac111da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'wallet-indexer.ts:58',message:'getViewingKey method not found',data:{availableMethods:apiKeys},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
	// #endregion

	// viewing key取得メソッドが存在しない場合
	throw new ViewingKeyError(
		"Viewing key is not available from the connected wallet. " +
			"The DApp Connector API may not support viewing key retrieval yet. " +
			"Please check the wallet documentation for viewing key access methods.",
	);
}

/**
 * ネットワークIDからviewing keyのプレフィックスを生成
 * 
 * @param networkId - ネットワークID
 * @returns viewing keyのプレフィックス（例: "mn_shield-esk_testnet-02"）
 */
export function getViewingKeyPrefix(networkId: NetworkId): string {
	// ネットワークIDに応じたプレフィックスを返す
	// mainnetの場合は "mn_shield-esk"、その他は "mn_shield-esk_" + networkId
	const networkPrefixMap: Record<NetworkId, string> = {
		"testnet-02": "mn_shield-esk_testnet-02",
		"0.18-undeployed1-kitsunesh": "mn_shield-esk_0.18-undeployed1-kitsunesh",
		"midnight-preview": "mn_shield-esk_midnight-preview",
		"localhost": "mn_shield-esk_localhost",
	};

	return networkPrefixMap[networkId] || `mn_shield-esk_${networkId}`;
}


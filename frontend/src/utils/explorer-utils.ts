/**
 * Explorer URL Generation Utility
 * Generate links to Polkadot.js.org explorer
 */

import { getCurrentNetworkConfig } from "./network-config";

/**
 * Generate explorer URL from block number (height)
 * Uses the current network's RPC URL
 */
export function getBlockExplorerUrl(blockNumber: number | string): string {
	if (blockNumber === undefined || blockNumber === null) {
		return "";
	}

	const networkConfig = getCurrentNetworkConfig();
	const rpcUrl = networkConfig.rpcUrl;

	// Convert RPC URL to WebSocket URL if needed
	let wsRpcUrl: string;
	if (rpcUrl.startsWith("http://")) {
		wsRpcUrl = rpcUrl.replace("http://", "ws://");
	} else if (rpcUrl.startsWith("https://")) {
		wsRpcUrl = rpcUrl.replace("https://", "wss://");
	} else if (rpcUrl.startsWith("ws://") || rpcUrl.startsWith("wss://")) {
		wsRpcUrl = rpcUrl;
	} else {
		// Default to wss:// if no protocol specified
		wsRpcUrl = `wss://${rpcUrl}`;
	}

	// Remove trailing slash if present
	wsRpcUrl = wsRpcUrl.replace(/\/$/, "");

	// Convert block number to string (use decimal, not hex)
	const blockNumberStr =
		typeof blockNumber === "string"
			? blockNumber.startsWith("0x")
				? parseInt(blockNumber, 16).toString()
				: blockNumber
			: blockNumber.toString();

	return `https://polkadot.js.org/apps/?rpc=${encodeURIComponent(wsRpcUrl)}#/explorer/query/${blockNumberStr}`;
}

/**
 * Generate explorer URL from block hash (deprecated, use block number instead)
 * @deprecated Use getBlockExplorerUrl with block number instead
 */
export function getBlockHashExplorerUrl(blockHash: string): string {
	if (!blockHash) {
		return "";
	}
	// For backward compatibility, try to extract block number from hash
	// But this is not reliable, so prefer using block number directly
	const networkConfig = getCurrentNetworkConfig();
	const rpcUrl = networkConfig.rpcUrl;
	let wsRpcUrl: string;
	if (rpcUrl.startsWith("http://")) {
		wsRpcUrl = rpcUrl.replace("http://", "ws://");
	} else if (rpcUrl.startsWith("https://")) {
		wsRpcUrl = rpcUrl.replace("https://", "wss://");
	} else if (rpcUrl.startsWith("ws://") || rpcUrl.startsWith("wss://")) {
		wsRpcUrl = rpcUrl;
	} else {
		wsRpcUrl = `wss://${rpcUrl}`;
	}
	wsRpcUrl = wsRpcUrl.replace(/\/$/, "");
	const hash = blockHash.startsWith("0x") ? blockHash : `0x${blockHash}`;
	return `https://polkadot.js.org/apps/?rpc=${encodeURIComponent(wsRpcUrl)}#/explorer/query/${hash}`;
}

/**
 * Generate explorer URL from block number (alias for getBlockExplorerUrl)
 * @deprecated Use getBlockExplorerUrl instead
 */
export function getBlockNumberExplorerUrl(
	blockNumber: number | string,
): string {
	return getBlockExplorerUrl(blockNumber);
}

/**
 * Extract block hash from JSON response and generate explorer URL
 */
export function extractBlockHashFromResult(result: unknown): string | null {
	if (!result) {
		return null;
	}

	// Direct block hash returned (if result is a string)
	if (typeof result === "string" && result.startsWith("0x")) {
		return result;
	}

	if (typeof result !== "object") {
		return null;
	}

	const obj = result as Record<string, unknown>;

	// block.block.header.hash or block.header.hash
	if (obj.block) {
		const block = obj.block as Record<string, unknown>;
		if (block.header) {
			const header = block.header as Record<string, unknown>;
			if (typeof header.hash === "string") {
				return header.hash;
			}
		}
	}

	// header.hash
	if (obj.header) {
		const header = obj.header as Record<string, unknown>;
		if (typeof header.hash === "string") {
			return header.hash;
		}
	}

	// Direct hash property
	if (typeof obj.hash === "string") {
		return obj.hash;
	}

	return null;
}

/**
 * Extract block number from JSON response
 */
export function extractBlockNumberFromResult(result: unknown): number | null {
	if (!result || typeof result !== "object") {
		return null;
	}

	const obj = result as Record<string, unknown>;

	// block.block.header.number
	if (obj.block) {
		const block = obj.block as Record<string, unknown>;
		if (block.header) {
			const header = block.header as Record<string, unknown>;
			if (header.number) {
				const numberStr =
					typeof header.number === "string"
						? header.number
						: String(header.number);
				// Convert from hexadecimal if needed
				if (numberStr.startsWith("0x")) {
					return parseInt(numberStr, 16);
				}
				return parseInt(numberStr, 10);
			}
		}
	}

	// header.number
	if (obj.header) {
		const header = obj.header as Record<string, unknown>;
		if (header.number) {
			const numberStr =
				typeof header.number === "string"
					? header.number
					: String(header.number);
			if (numberStr.startsWith("0x")) {
				return parseInt(numberStr, 16);
			}
			return parseInt(numberStr, 10);
		}
	}

	// Direct number property
	if (obj.number !== undefined) {
		const numberStr =
			typeof obj.number === "string" ? obj.number : String(obj.number);
		if (numberStr.startsWith("0x")) {
			return parseInt(numberStr, 16);
		}
		return parseInt(numberStr, 10);
	}

	return null;
}

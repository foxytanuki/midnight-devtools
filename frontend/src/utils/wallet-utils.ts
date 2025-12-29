/**
 * Midnight Wallet統合用のユーティリティ関数
 * レガシーCIP-30互換関数（後方互換性のため残す）
 */

import type { Cip30WalletApi, WalletName } from "../types/wallet-types";

/**
 * アドレスをフォーマット（短縮表示）
 * Midnight Networkアドレスのプレフィックス（mn_shield-addr_testなど）を保持
 */
export function formatAddress(
	address: string,
	prefixLength = 6,
	suffixLength = 8,
): string {
	if (address.length <= prefixLength + suffixLength) {
		return address;
	}

	// Midnight Networkアドレスのプレフィックスを検出
	const midnightPrefixes = [
		"mn_shield-addr_test",
		"mn_shield-addr_",
		"addr_test",
		"addr_",
	];

	let meaningfulPrefix = "";
	let remainingAddress = address;

	// プレフィックスを検出
	for (const prefix of midnightPrefixes) {
		if (address.startsWith(prefix)) {
			meaningfulPrefix = prefix;
			remainingAddress = address.slice(prefix.length);
			break;
		}
	}

	// プレフィックスが見つかった場合
	if (meaningfulPrefix) {
		// 残りのアドレスが短い場合はそのまま返す
		if (remainingAddress.length <= suffixLength) {
			return address;
		}
		// プレフィックス + 最初の数文字 + ... + 最後の数文字
		const startChars = remainingAddress.slice(0, 4);
		const endChars = remainingAddress.slice(-suffixLength);
		return `${meaningfulPrefix}${startChars}...${endChars}`;
	}

	// 通常のアドレスの場合（プレフィックスなし）
	const prefix = address.slice(0, prefixLength);
	const suffix = address.slice(-suffixLength);

	return `${prefix}...${suffix}`;
}

/**
 * アドレスを取得（複数の方法を試行）
 * レガシーCIP-30互換関数
 */
export async function getAddress(api: Cip30WalletApi): Promise<string> {
	// 方法1: 使用済みアドレスを取得
	try {
		const usedAddresses = await api.getUsedAddresses();
		if (usedAddresses && usedAddresses.length > 0) {
			return usedAddresses[0];
		}
	} catch (error) {
		console.warn("getUsedAddresses failed, trying alternative methods", error);
	}

	// 方法2: 未使用アドレスを取得
	try {
		const unusedAddresses = await api.getUnusedAddresses();
		if (unusedAddresses && unusedAddresses.length > 0) {
			return unusedAddresses[0];
		}
	} catch (error) {
		console.warn("getUnusedAddresses failed, trying change address", error);
	}

	// 方法3: お釣りアドレスを取得
	try {
		const changeAddress = await api.getChangeAddress();
		if (changeAddress) {
			return changeAddress;
		}
	} catch (error) {
		console.warn("getChangeAddress failed", error);
	}

	throw new Error("No addresses found in wallet");
}

/**
 * 残高を取得
 * レガシーCIP-30互換関数
 */
export async function getBalance(api: Cip30WalletApi): Promise<string> {
	return await api.getBalance();
}

/**
 * レガシー関数（後方互換性のため残す）
 * 新しい実装では使用しないこと
 */
export function getAvailableWallets(): Array<{
	name: WalletName;
	displayName: string;
	installed: boolean;
	provider?: any;
	icon?: string;
	isMidnightNative?: boolean;
}> {
	// レガシー関数 - 新しい実装ではMidnightBrowserWallet.getAvailableWallets()を使用すること
	console.warn(
		"getAvailableWallets() is deprecated. Use MidnightBrowserWallet.getAvailableWallets() instead.",
	);
	return [];
}

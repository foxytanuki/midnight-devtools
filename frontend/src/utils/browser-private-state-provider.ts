/**
 * ブラウザ環境用のPrivate State Provider
 * localStorageを使用してprivate stateを保存・取得します
 */

import type { PrivateStateProvider } from "@midnight-ntwrk/midnight-js-types";

/**
 * localStorageベースのPrivate State Providerを作成
 */
export function browserPrivateStateProvider<T extends string>(
	options: { privateStateStoreName: string },
): PrivateStateProvider<T> {
	const storageKey = `midnight_private_state_${options.privateStateStoreName}`;

	return {
		async getPrivateState(): Promise<Uint8Array | null> {
			try {
				const stored = localStorage.getItem(storageKey);
				if (!stored) {
					return null;
				}
				const bytes = JSON.parse(stored);
				return new Uint8Array(bytes);
			} catch {
				return null;
			}
		},

		async setPrivateState(state: Uint8Array): Promise<void> {
			try {
				const bytes = Array.from(state);
				localStorage.setItem(storageKey, JSON.stringify(bytes));
			} catch (error) {
				console.error("Failed to save private state:", error);
				throw error;
			}
		},

		async deletePrivateState(): Promise<void> {
			try {
				localStorage.removeItem(storageKey);
			} catch (error) {
				console.error("Failed to delete private state:", error);
				throw error;
			}
		},
	};
}


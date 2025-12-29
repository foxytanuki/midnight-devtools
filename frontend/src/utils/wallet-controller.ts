/**
 * Midnight Browser Wallet Controller
 * DApp Connector APIを使用したウォレット接続管理
 */

import type {
	ConnectedAPI,
	InitialAPI,
	Configuration,
	ConnectionStatus,
} from "../types/wallet-types";
import { pipe as fnPipe } from "fp-ts/lib/function.js";
import {
	catchError,
	concatMap,
	filter,
	firstValueFrom,
	interval,
	map,
	take,
	tap,
	throwError,
	timeout,
} from "rxjs";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import type {
	DustAddress,
	DustBalance,
	ShieldedAddress,
	ShieldedBalance,
	UnshieldedAddress,
	UnshieldedBalanceDappConnector,
} from "../types/wallet-types";
import { checkProofServerStatus } from "./proof-server";

export class MidnightBrowserWallet {
	public initialAPI: InitialAPI | undefined;
	public connectedAPI: ConnectedAPI | undefined;
	public serviceUriConfig: Configuration | undefined;
	public status: ConnectionStatus | undefined;
	public dustAddress: DustAddress | undefined;
	public dustBalance: DustBalance | undefined;
	public shieldedAddresses: ShieldedAddress | undefined;
	public shieldedBalances: ShieldedBalance | undefined;
	public unshieldedAddress: UnshieldedAddress | undefined;
	public unshieldedBalances: UnshieldedBalanceDappConnector | undefined;
	public proofServerOnline: boolean = false;

	private constructor(
		initialAPI: InitialAPI | undefined,
		connectedAPI: ConnectedAPI | undefined,
		serviceUriConfig: Configuration | undefined,
		status: ConnectionStatus | undefined,
		dustAddress: DustAddress | undefined,
		dustBalance: DustBalance | undefined,
		shieldedAddresses: ShieldedAddress | undefined,
		shieldedBalances: ShieldedBalance | undefined,
		unshieldedAddress: UnshieldedAddress | undefined,
		unshieldedBalances: UnshieldedBalanceDappConnector | undefined,
		proofServerOnline: boolean = false,
	) {
		this.initialAPI = initialAPI;
		this.connectedAPI = connectedAPI;
		this.serviceUriConfig = serviceUriConfig;
		this.status = status;
		this.dustAddress = dustAddress;
		this.dustBalance = dustBalance;
		this.shieldedAddresses = shieldedAddresses;
		this.shieldedBalances = shieldedBalances;
		this.unshieldedAddress = unshieldedAddress;
		this.unshieldedBalances = unshieldedBalances;
		this.proofServerOnline = proofServerOnline;
	}

	/**
	 * 利用可能なウォレットを取得（Laceのみ）
	 */
	static getAvailableWallets(): InitialAPI[] {
		if (typeof window === "undefined") return [];
		if (window.midnight === undefined) {
			return [];
		}

		const wallets: InitialAPI[] = [];
		const seenRdns = new Set<string>();

		for (const key in window.midnight) {
			try {
				const _wallet = window.midnight[key] as InitialAPI & {
					rdns?: string;
					icon?: string;
				};

				if (_wallet === undefined) continue;
				if (_wallet.name === undefined) continue;
				if (_wallet.apiVersion === undefined) continue;

				// rdnsが存在しない場合はkeyをrdnsとして使用
				const rdns = _wallet.rdns || key;

				// 重複を防ぐ（同じrdnsは1回だけ）
				if (seenRdns.has(rdns)) continue;

				// Laceのみをフィルタリング
				const isLace =
					_wallet.name.toLowerCase().includes("lace") ||
					key.toLowerCase().includes("lace");

				if (isLace) {
					seenRdns.add(rdns);
					wallets.push({
						name: _wallet.name,
						apiVersion: _wallet.apiVersion,
						connect: _wallet.connect,
						icon: _wallet.icon,
						rdns: rdns,
					} as InitialAPI);
				}
			} catch (e) {
				console.log(e);
			}
		}

		return wallets;
	}

	/**
	 * localStorageから接続情報を取得
	 */
	static getMidnightWalletConnected(): {
		rdns: string | null;
		networkID: string | null;
	} {
		const rdns = window.localStorage.getItem("rdns-connected");
		const networkID = window.localStorage.getItem("network-id");
		return { rdns, networkID };
	}

	/**
	 * localStorageに接続情報を保存
	 */
	static setMidnightWalletConnected(rdns: string, networkID: string): void {
		window.localStorage.setItem("rdns-connected", rdns);
		window.localStorage.setItem("network-id", networkID);
	}

	/**
	 * localStorageから接続情報を削除
	 */
	static deleteMidnightWalletConnected(): void {
		window.localStorage.removeItem("rdns-connected");
		window.localStorage.removeItem("network-id");
	}

	/**
	 * ウォレットに接続
	 * RxJSを使用した堅牢な接続フロー
	 */
	static async connectToWallet(
		rdns: string,
		networkID: string,
	): Promise<MidnightBrowserWallet> {
		return firstValueFrom(
			fnPipe(
				interval(100),
				map(() => window.midnight?.[rdns]),
				tap((initialAPI) => {
					if (initialAPI) {
						console.log("Compatible wallet initial API found. Connecting.");
					}
				}),
				filter((initialAPI): initialAPI is InitialAPI => !!initialAPI),
				tap(() => {
					console.log("Compatible wallet initial API found. Connecting.");
				}),
				take(1),
				timeout({
					first: 1_000,
					with: () =>
						throwError(() => {
							console.error("Could not find wallet initial API");
							return new Error("Could not find wallet initial API");
						}),
				}),
				concatMap(async (initialAPI) => {
					try {
						const connectedAPI = await initialAPI.connect(networkID);
						return {
							connectedAPI,
							initialAPI,
						};
					} catch (error: any) {
						// Network ID mismatchエラーの場合は、より具体的なエラーメッセージを返す
						if (error?.message?.includes("Network ID mismatch")) {
							console.error("Network ID mismatch:", error);
							throw new Error(
								"Network ID mismatch detected.\n\n" +
								"Lace Wallet's network setting cannot be changed automatically. " +
								"You need to manually change it in Lace Wallet settings:\n\n" +
								"1. Open Lace Wallet extension\n" +
								"2. Go to Settings > Wallet > Midnight\n" +
								"3. Select the network that matches the selected network in this app\n" +
								"4. Disconnect and reconnect your wallet here",
							);
						}
						// その他のエラーは通常のエラーハンドリングに委譲
						throw error;
					}
				}),
				catchError((error, apis) => {
					if (error) {
						console.error("Unable to enable connector API:", error);
						// Network ID mismatchエラーの場合は、そのまま伝播
						if (
							error instanceof Error &&
							error.message.includes("Network ID mismatch")
						) {
							return throwError(() => error);
						}
						return throwError(() => {
							return new Error("Application is not authorized");
						});
					}
					return apis;
				}),
				concatMap(async ({ connectedAPI, initialAPI }) => {
					if (!connectedAPI) {
						throw new Error("Connected API is undefined");
					}
					try {
						const serviceUriConfig = await connectedAPI.getConfiguration();
						const status = await connectedAPI.getConnectionStatus();
						const dustAddress = await connectedAPI.getDustAddress();
						const dustBalance = await connectedAPI.getDustBalance();
						const shieldedAddresses = await connectedAPI.getShieldedAddresses();
						const shieldedBalances = await connectedAPI.getShieldedBalances();
						const unshieldedAddress = await connectedAPI.getUnshieldedAddress();
						const unshieldedBalances =
							await connectedAPI.getUnshieldedBalances();
						const proofServerOnline = await checkProofServerStatus(
							serviceUriConfig.proverServerUri,
						).catch((error) => {
							console.warn("Failed to check proof server status:", error);
							return false;
						});

						console.log("Connected to wallet");

						const wallet = new MidnightBrowserWallet(
							initialAPI,
							connectedAPI,
							serviceUriConfig,
							status,
							dustAddress,
							dustBalance,
							shieldedAddresses,
							shieldedBalances,
							unshieldedAddress,
							unshieldedBalances,
							proofServerOnline,
						);

						// 接続情報を保存
						const connectedNetworkID =
							status.status === "connected" ? status.networkId : null;
						if (connectedNetworkID === null) {
							throw new Error("Network ID is null");
						}
						MidnightBrowserWallet.setMidnightWalletConnected(
							rdns,
							connectedNetworkID,
						);
						setNetworkId(connectedNetworkID);

						return wallet;
					} catch (error) {
						console.error("Failed to initialize wallet:", error);
						throw error;
					}
				}),
			),
		);
	}

	/**
	 * 接続を切断
	 */
	disconnect(): void {
		MidnightBrowserWallet.deleteMidnightWalletConnected();
		this.initialAPI = undefined;
		this.connectedAPI = undefined;
		this.serviceUriConfig = undefined;
		this.status = undefined;
		this.dustAddress = undefined;
		this.dustBalance = undefined;
		this.shieldedAddresses = undefined;
		this.shieldedBalances = undefined;
		this.unshieldedAddress = undefined;
		this.unshieldedBalances = undefined;
		this.proofServerOnline = false;
	}

	/**
	 * 状態を更新
	 */
	async refresh(): Promise<void> {
		if (this.connectedAPI === undefined) return;
		this.serviceUriConfig = await this.connectedAPI.getConfiguration();
		this.status = await this.connectedAPI.getConnectionStatus();
		this.dustAddress = await this.connectedAPI.getDustAddress();
		this.dustBalance = await this.connectedAPI.getDustBalance();
		this.shieldedAddresses = await this.connectedAPI.getShieldedAddresses();
		this.shieldedBalances = await this.connectedAPI.getShieldedBalances();
		this.unshieldedAddress = await this.connectedAPI.getUnshieldedAddress();
		this.unshieldedBalances = await this.connectedAPI.getUnshieldedBalances();
		this.proofServerOnline = await checkProofServerStatus(
			this.serviceUriConfig.proverServerUri,
		);
	}
}

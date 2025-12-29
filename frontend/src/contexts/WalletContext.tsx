import { createContext, useCallback, useEffect, useState } from "react";
import { MidnightBrowserWallet } from "../utils/wallet-controller";
import type {
	Configuration,
	ConnectedAPI,
	ConnectionStatus,
	InitialAPI,
	DustAddress,
	DustBalance,
	ShieldedAddress,
	ShieldedBalance,
	UnshieldedAddress,
	UnshieldedBalanceDappConnector,
} from "../types/wallet-types";
import { useNetwork } from "./NetworkContext";
import { mapToWalletNetworkId } from "../utils/network-config";

interface MidnightMeshProviderProps {
	children: React.ReactNode;
}

export interface WalletContext {
	connectingWallet: boolean;
	open: boolean;
	setOpen: (value: boolean) => void;
	error?: any | undefined;
	initialAPI: InitialAPI | undefined;
	connectedAPI: ConnectedAPI | undefined;
	serviceUriConfig: Configuration | undefined;
	status: ConnectionStatus | undefined;
	dustAddress: DustAddress | undefined;
	dustBalance: DustBalance | undefined;
	shieldedAddresses: ShieldedAddress | undefined;
	shieldedBalances: ShieldedBalance | undefined;
	unshieldedAddress: UnshieldedAddress | undefined;
	unshieldedBalances: UnshieldedBalanceDappConnector | undefined;
	proofServerOnline: boolean | undefined;
	connectWallet:
		| ((rdns: string, networkID: string) => Promise<void>)
		| undefined;
	disconnect: () => void;
	refresh: () => void;
}

export const WalletContext = createContext<WalletContext>({
	connectingWallet: false,
	open: false,
	setOpen: () => {},
	error: undefined,
	initialAPI: undefined,
	connectedAPI: undefined,
	serviceUriConfig: undefined,
	status: undefined,
	dustAddress: undefined,
	dustBalance: undefined,
	shieldedAddresses: undefined,
	shieldedBalances: undefined,
	unshieldedAddress: undefined,
	unshieldedBalances: undefined,
	proofServerOnline: undefined,
	connectWallet: undefined,
	disconnect: () => {},
	refresh: () => {},
});

export const MidnightMeshProvider = ({
	children,
}: MidnightMeshProviderProps) => {
	const store = useWalletStore();
	return (
		<WalletContext.Provider value={store}>
			<>{children}</>
		</WalletContext.Provider>
	);
};

export const useWalletStore = (): WalletContext => {
	const [connectingWallet, setConnectingWallet] = useState<boolean>(false);
	const [open, setOpen] = useState(false);
	const [error, setError] = useState<any | undefined>(undefined);
	const [initialAPI, setInitialAPI] = useState<InitialAPI | undefined>(
		undefined,
	);
	const [connectedAPI, setConnectedAPI] = useState<ConnectedAPI | undefined>(
		undefined,
	);
	const [serviceUriConfig, setServiceUriConfig] = useState<
		Configuration | undefined
	>(undefined);
	const [status, setStatus] = useState<ConnectionStatus | undefined>(undefined);
	const [dustAddress, setDustAddress] = useState<DustAddress | undefined>(
		undefined,
	);
	const [dustBalance, setDustBalance] = useState<DustBalance | undefined>(
		undefined,
	);
	const [shieldedAddresses, setShieldedAddresses] = useState<
		ShieldedAddress | undefined
	>(undefined);
	const [shieldedBalances, setShieldedBalances] = useState<
		ShieldedBalance | undefined
	>(undefined);
	const [unshieldedAddress, setUnshieldedAddress] = useState<
		UnshieldedAddress | undefined
	>(undefined);
	const [unshieldedBalances, setUnshieldedBalances] = useState<
		UnshieldedBalanceDappConnector | undefined
	>(undefined);
	const [proofServerOnline, setProofServerOnline] = useState<
		boolean | undefined
	>(false);
	const [midnightBrowserWalletInstance, setMidnightBrowserWalletInstance] =
		useState<MidnightBrowserWallet | undefined>(undefined);

	const connectWallet = useCallback(
		async (rdns: string, networkID: string) => {
			setConnectingWallet(true);
			setError(undefined);

			try {
				// ネットワークIDをLace Walletがサポートする形式にマッピング
				const walletNetworkId = mapToWalletNetworkId(networkID as any);
				const midnightBrowserWalletInstance =
					await MidnightBrowserWallet.connectToWallet(rdns, walletNetworkId);
				setInitialAPI(midnightBrowserWalletInstance.initialAPI);
				setConnectedAPI(midnightBrowserWalletInstance.connectedAPI);
				setError(undefined);
				setServiceUriConfig(midnightBrowserWalletInstance.serviceUriConfig);
				setStatus(midnightBrowserWalletInstance.status);
				setDustAddress(midnightBrowserWalletInstance.dustAddress);
				setDustBalance(midnightBrowserWalletInstance.dustBalance);
				setShieldedAddresses(midnightBrowserWalletInstance.shieldedAddresses);
				setShieldedBalances(midnightBrowserWalletInstance.shieldedBalances);
				setUnshieldedAddress(midnightBrowserWalletInstance.unshieldedAddress);
				setUnshieldedBalances(midnightBrowserWalletInstance.unshieldedBalances);
				setProofServerOnline(midnightBrowserWalletInstance.proofServerOnline);
				setMidnightBrowserWalletInstance(midnightBrowserWalletInstance);
			} catch (error) {
				console.error("Failed to connect wallet:", error);
				// Network ID mismatchエラーの場合、自動的に切断してから再接続を試みる
				if (
					error instanceof Error &&
					error.message.includes("Network ID mismatch")
				) {
					console.warn(
						"Network ID mismatch detected, disconnecting and retrying connection",
					);
					// 既存の接続を切断（localStorageをクリアし、既存のインスタンスがあれば切断）
					MidnightBrowserWallet.deleteMidnightWalletConnected();
					if (midnightBrowserWalletInstance) {
						midnightBrowserWalletInstance.disconnect();
					}
					// 状態をリセット
					setInitialAPI(undefined);
					setConnectedAPI(undefined);
					setServiceUriConfig(undefined);
					setStatus(undefined);
					setDustAddress(undefined);
					setDustBalance(undefined);
					setShieldedAddresses(undefined);
					setShieldedBalances(undefined);
					setUnshieldedAddress(undefined);
					setUnshieldedBalances(undefined);
					setProofServerOnline(undefined);
					setMidnightBrowserWalletInstance(undefined);
					// 少し待ってから再接続を試みる
					await new Promise((resolve) => setTimeout(resolve, 500));
					try {
						const walletNetworkId = mapToWalletNetworkId(networkID as any);
						const midnightBrowserWalletInstance =
							await MidnightBrowserWallet.connectToWallet(
								rdns,
								walletNetworkId,
							);
						setInitialAPI(midnightBrowserWalletInstance.initialAPI);
						setConnectedAPI(midnightBrowserWalletInstance.connectedAPI);
						setError(undefined);
						setServiceUriConfig(midnightBrowserWalletInstance.serviceUriConfig);
						setStatus(midnightBrowserWalletInstance.status);
						setDustAddress(midnightBrowserWalletInstance.dustAddress);
						setDustBalance(midnightBrowserWalletInstance.dustBalance);
						setShieldedAddresses(
							midnightBrowserWalletInstance.shieldedAddresses,
						);
						setShieldedBalances(midnightBrowserWalletInstance.shieldedBalances);
						setUnshieldedAddress(
							midnightBrowserWalletInstance.unshieldedAddress,
						);
						setUnshieldedBalances(
							midnightBrowserWalletInstance.unshieldedBalances,
						);
						setProofServerOnline(
							midnightBrowserWalletInstance.proofServerOnline,
						);
						setMidnightBrowserWalletInstance(midnightBrowserWalletInstance);
					} catch (retryError) {
						console.error("Failed to reconnect after disconnect:", retryError);
						setError(
							retryError instanceof Error
								? retryError
								: new Error(String(retryError)),
						);
					}
				} else {
					setError(error instanceof Error ? error : new Error(String(error)));
				}
			} finally {
				setConnectingWallet(false);
			}
		},
		[midnightBrowserWalletInstance],
	);

	const disconnect = useCallback(() => {
		MidnightBrowserWallet.deleteMidnightWalletConnected();
		midnightBrowserWalletInstance?.disconnect();
		setInitialAPI(undefined);
		setConnectedAPI(undefined);
		setError(undefined);
		setServiceUriConfig(undefined);
		setStatus(undefined);
		setDustAddress(undefined);
		setDustBalance(undefined);
		setShieldedAddresses(undefined);
		setShieldedBalances(undefined);
		setUnshieldedAddress(undefined);
		setUnshieldedBalances(undefined);
		setProofServerOnline(undefined);
		setMidnightBrowserWalletInstance(undefined);
	}, [midnightBrowserWalletInstance]);

	const refresh = useCallback(async () => {
		if (midnightBrowserWalletInstance === undefined) return;
		await midnightBrowserWalletInstance.refresh();
		setServiceUriConfig(midnightBrowserWalletInstance.serviceUriConfig);
		setStatus(midnightBrowserWalletInstance.status);
		setDustAddress(midnightBrowserWalletInstance.dustAddress);
		setDustBalance(midnightBrowserWalletInstance.dustBalance);
		setShieldedAddresses(midnightBrowserWalletInstance.shieldedAddresses);
		setShieldedBalances(midnightBrowserWalletInstance.shieldedBalances);
		setUnshieldedAddress(midnightBrowserWalletInstance.unshieldedAddress);
		setUnshieldedBalances(midnightBrowserWalletInstance.unshieldedBalances);
		setProofServerOnline(midnightBrowserWalletInstance.proofServerOnline);
	}, [midnightBrowserWalletInstance]);

	// 自動再接続機能
	const { currentNetwork } = useNetwork();
	useEffect(() => {
		// 既に接続されている場合はスキップ
		if (connectedAPI || connectingWallet) {
			return;
		}

		const { rdns, networkID } =
			MidnightBrowserWallet.getMidnightWalletConnected();

		if (rdns && networkID) {
			// 保存されたnetworkID（Lace Walletがサポートする形式）を現在のネットワークIDにマッピングして比較
			const currentWalletNetworkId = mapToWalletNetworkId(currentNetwork.id);
			if (networkID === currentWalletNetworkId) {
				// ネットワークIDが一致する場合のみ再接続
				// 保存されたnetworkIDをそのまま使用（Lace Walletがサポートする形式）
				connectWallet(rdns, currentNetwork.id).catch((error) => {
					// Network ID mismatchエラーの場合、ウォレットが既に別のネットワークに接続されている可能性がある
					if (
						error instanceof Error &&
						error.message.includes("Network ID mismatch")
					) {
						console.warn(
							"Network ID mismatch detected, disconnecting and clearing saved connection",
						);
						disconnect();
					}
				});
			} else {
				// If a wallet was connected to a different network, disconnect it
				disconnect();
			}
		}
	}, [
		currentNetwork.id,
		connectedAPI,
		connectingWallet,
		connectWallet,
		disconnect,
	]);

	return {
		connectingWallet,
		open,
		setOpen,
		error,
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
		connectWallet,
		disconnect,
		refresh,
	};
};

import { useEffect, useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { MidnightBrowserWallet } from "../utils/wallet-controller";
import { useNetwork } from "../contexts/NetworkContext";
import { mapToWalletNetworkId } from "../utils/network-config";
import "../App.css";

interface WalletConnectionProps {
	onConnected?: () => void;
	onDisconnected?: () => void;
}

export function WalletConnection({
	onConnected,
	onDisconnected,
}: WalletConnectionProps) {
	const {
		connectingWallet,
		error,
		status,
		unshieldedAddress,
		shieldedAddresses,
		dustAddress,
		proofServerOnline,
		connectWallet,
		disconnect,
		refresh,
	} = useWallet();
	const { currentNetwork } = useNetwork();
	const [wallets, setWallets] = useState(
		MidnightBrowserWallet.getAvailableWallets(),
	);

	// ウォレットリストを更新
	useEffect(() => {
		const interval = setInterval(() => {
			setWallets(MidnightBrowserWallet.getAvailableWallets());
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	const handleConnect = async (rdns: string) => {
		try {
			await connectWallet(rdns, currentNetwork.id);
			onConnected?.();
		} catch (err) {
			console.error("Failed to connect wallet:", err);
		}
	};

	const handleDisconnect = () => {
		disconnect();
		onDisconnected?.();
	};

	const handleRefresh = async () => {
		await refresh();
	};

	const isConnected = status?.status === "connected";

	return (
		<div className="method-panel">
			<h2>Wallet Connection</h2>
			<p className="method-description-text">
				Connect to Lace Wallet to interact with Midnight Network. The wallet
				will automatically reconnect on page reload. Use the network selector in
				the navigation bar to change networks.
			</p>

			<div className="params-section">
				<h3>Available Wallets</h3>
				<div className="wallet-list">
					{wallets.length === 0 ? (
						<div className="info-box">
							<strong>No wallets found.</strong>
							<br />
							Please install Lace Wallet extension from{" "}
							<a
								href="https://www.lace.io/"
								target="_blank"
								rel="noopener noreferrer"
								style={{
									color: "var(--color-primary)",
									textDecoration: "underline",
								}}
							>
								lace.io
							</a>
						</div>
					) : (
						wallets.map((wallet, index) => {
							// Lace Walletのアイコンパスを決定
							const iconPath = wallet.name.toLowerCase().includes("lace")
								? "/wallet-icons/lace.png"
								: wallet.icon || null;

							// key prop用の一意の識別子（rdnsが存在しない場合はフォールバック）
							const walletKey = wallet.rdns || `${wallet.name}-${index}`;

							return (
								<div key={walletKey} className="wallet-item">
									<div className="wallet-info">
										<div className="wallet-header">
											{iconPath ? (
												<img
													src={iconPath}
													alt={wallet.name}
													className="wallet-icon-small"
													onError={() => {
														console.error(
															"Failed to load wallet icon:",
															iconPath,
														);
													}}
												/>
											) : (
												<div
													className="wallet-icon-placeholder"
													style={{
														width: "24px",
														height: "24px",
														backgroundColor: "var(--color-surface)",
														borderRadius: "4px",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														fontSize: "12px",
														color: "var(--color-text-secondary)",
													}}
												>
													{wallet.name.charAt(0).toUpperCase()}
												</div>
											)}
											<div className="wallet-name">{wallet.name}</div>
										</div>
										<div className="wallet-status installed">Installed</div>
									</div>
									{isConnected &&
									status?.networkId ===
										mapToWalletNetworkId(currentNetwork.id) ? (
										<button
											type="button"
											className="wallet-connect-button"
											disabled
										>
											Connected
										</button>
									) : (
										<button
											type="button"
											onClick={() => handleConnect(wallet.rdns)}
											disabled={connectingWallet || isConnected}
											className="wallet-connect-button"
										>
											{connectingWallet ? "Connecting..." : "Connect"}
										</button>
									)}
								</div>
							);
						})
					)}
				</div>
			</div>

			{isConnected && (
				<div className="params-section">
					<h3>Connection Info</h3>
					<div className="connection-info">
						<div className="info-item">
							<label>Status:</label>
							<span style={{ color: "var(--color-success)" }}>
								Connected ({status.networkId})
							</span>
						</div>

						{unshieldedAddress && (
							<div className="info-item">
								<label>Unshielded Address:</label>
								<div className="address-display">
									<span className="address-full">
										{unshieldedAddress.unshieldedAddress}
									</span>
									<button
										type="button"
										onClick={() => {
											navigator.clipboard.writeText(
												unshieldedAddress.unshieldedAddress,
											);
										}}
										className="copy-button"
										title="Copy address"
									>
										Copy
									</button>
								</div>
							</div>
						)}

						{shieldedAddresses && (
							<div className="info-item">
								<label>Shielded Address:</label>
								<div className="address-display">
									<span className="address-full">
										{shieldedAddresses.shieldedAddress}
									</span>
									<button
										type="button"
										onClick={() => {
											navigator.clipboard.writeText(
												shieldedAddresses.shieldedAddress,
											);
										}}
										className="copy-button"
										title="Copy address"
									>
										Copy
									</button>
								</div>
							</div>
						)}

						{dustAddress && (
							<div className="info-item">
								<label>Dust Address:</label>
								<div className="address-display">
									<span className="address-full">
										{dustAddress.dustAddress}
									</span>
									<button
										type="button"
										onClick={() => {
											navigator.clipboard.writeText(dustAddress.dustAddress);
										}}
										className="copy-button"
										title="Copy address"
									>
										Copy
									</button>
								</div>
							</div>
						)}

						<div className="info-item">
							<label>Proof Server:</label>
							<span>
								{proofServerOnline === undefined ? (
									"Unknown"
								) : proofServerOnline ? (
									<span style={{ color: "var(--color-success)" }}>Online</span>
								) : (
									<span style={{ color: "var(--color-error)" }}>Offline</span>
								)}
							</span>
						</div>

						<div className="connection-actions">
							<button
								type="button"
								onClick={handleRefresh}
								className="refresh-button"
							>
								Refresh
							</button>
							<button
								type="button"
								onClick={handleDisconnect}
								className="disconnect-button"
							>
								Disconnect
							</button>
						</div>
					</div>
				</div>
			)}

			{error && (
				<div className="error-panel">
					<h3>Error</h3>
					<pre>{error instanceof Error ? error.message : String(error)}</pre>
				</div>
			)}

			<div className="params-section">
				<h3>Usage</h3>
				<ol className="usage-list">
					<li>
						Install Lace Wallet extension from{" "}
						<a
							href="https://www.lace.io/"
							target="_blank"
							rel="noopener noreferrer"
							style={{
								color: "var(--color-primary)",
								textDecoration: "underline",
							}}
						>
							lace.io
						</a>
					</li>
					<li>
						Create or import a wallet and obtain testnet tokens (tDUST) from the{" "}
						<a
							href="https://midnight.network/test-faucet"
							target="_blank"
							rel="noopener noreferrer"
							style={{
								color: "var(--color-primary)",
								textDecoration: "underline",
							}}
						>
							Midnight Testnet Faucet
						</a>
					</li>
					<li>
						Select your network from the dropdown in the top right corner
					</li>
					<li>Click the "Connect" button to connect your wallet</li>
					<li>
						After connection, your addresses (unshielded, shielded, dust) will
						be displayed
					</li>
				</ol>
				<div className="info-box">
					<strong>Note about Auto-Reconnection:</strong>
					<br />
					<br />
					The wallet connection is automatically saved and will reconnect when
					you reload the page. To disconnect, click the "Disconnect" button.
					<br />
					<br />
					<strong>Note about Proof Server:</strong>
					<br />
					<br />
					Midnight Network uses <strong>proof-based transactions</strong>{" "}
					instead of signatures. When using DApp Connector API's{" "}
					<code>balanceAndProveTransaction()</code> method, the wallet handles
					proof generation internally.
					<br />
					<br />
					For direct contract interactions using Midnight.js (outside DApp
					Connector API), a local Proof Server is required:
					<br />
					<code>
						docker run -p 6300:6300 midnightnetwork/proof-server:latest
					</code>
				</div>
			</div>
		</div>
	);
}

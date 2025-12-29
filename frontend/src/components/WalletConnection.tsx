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
		initialAPI,
		serviceUriConfig,
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
				<>
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

					<div className="params-section">
						<h3>Connection Details</h3>
						<p className="method-description-text">
							Network and connection status
						</p>
						<div className="connection-info">
							<div className="info-item">
								<label>Wallet Status</label>
								<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
									<div
										style={{
											width: "8px",
											height: "8px",
											borderRadius: "50%",
											backgroundColor:
												status?.status === "connected"
													? "var(--color-success)"
													: "var(--color-text-muted)",
										}}
									/>
									<span>
										{status?.status === "connected"
											? "Connected"
											: "Disconnected"}
									</span>
								</div>
								{status?.status === "connected" && (
									<div
										style={{
											marginTop: "0.5rem",
											marginLeft: "1rem",
											fontSize: "0.8125rem",
											color: "var(--color-text-secondary)",
										}}
									>
										Network: {status?.networkId}
									</div>
								)}
								{initialAPI && (
									<div
										style={{
											marginTop: "0.5rem",
											marginLeft: "1rem",
											fontSize: "0.8125rem",
											color: "var(--color-text-secondary)",
										}}
									>
										Wallet Name: {initialAPI.name || "Not connected"}
									</div>
								)}
							</div>

							<div className="info-item">
								<label>Proof Server</label>
								<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
									{proofServerOnline === undefined ? (
										<>
											<div
												style={{
													width: "8px",
													height: "8px",
													borderRadius: "50%",
													backgroundColor: "var(--color-text-muted)",
												}}
											/>
											<span>Unknown</span>
										</>
									) : proofServerOnline ? (
										<>
											<div
												style={{
													width: "8px",
													height: "8px",
													borderRadius: "50%",
													backgroundColor: "var(--color-success)",
												}}
											/>
											<span style={{ color: "var(--color-success)" }}>
												Online
											</span>
										</>
									) : (
										<>
											<div
												style={{
													width: "8px",
													height: "8px",
													borderRadius: "50%",
													backgroundColor: "var(--color-error)",
												}}
											/>
											<span style={{ color: "var(--color-error)" }}>
												Offline
											</span>
										</>
									)}
								</div>
							</div>

							<div className="info-item">
								<label>Network Endpoints</label>
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										gap: "0.75rem",
										marginTop: "0.5rem",
									}}
								>
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											gap: "0.25rem",
										}}
									>
										<div
											style={{
												fontSize: "0.75rem",
												color: "var(--color-text-secondary)",
											}}
										>
											Substrate Node
										</div>
										<div
											style={{
												fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
												fontSize: "0.8125rem",
												color: "var(--color-text)",
												wordBreak: "break-all",
											}}
										>
											{serviceUriConfig?.substrateNodeUri || "Not available"}
										</div>
									</div>
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											gap: "0.25rem",
										}}
									>
										<div
											style={{
												fontSize: "0.75rem",
												color: "var(--color-text-secondary)",
											}}
										>
											Indexer (REST)
										</div>
										<div
											style={{
												fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
												fontSize: "0.8125rem",
												color: "var(--color-text)",
												wordBreak: "break-all",
											}}
										>
											{serviceUriConfig?.indexerUri || "Not available"}
										</div>
									</div>
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											gap: "0.25rem",
										}}
									>
										<div
											style={{
												fontSize: "0.75rem",
												color: "var(--color-text-secondary)",
											}}
										>
											Indexer (WebSocket)
										</div>
										<div
											style={{
												fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
												fontSize: "0.8125rem",
												color: "var(--color-text)",
												wordBreak: "break-all",
											}}
										>
											{serviceUriConfig?.indexerWsUri || "Not available"}
										</div>
									</div>
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											gap: "0.25rem",
										}}
									>
										<div
											style={{
												fontSize: "0.75rem",
												color: "var(--color-text-secondary)",
											}}
										>
											Proof Server
										</div>
										<div
											style={{
												fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
												fontSize: "0.8125rem",
												color: "var(--color-text)",
												wordBreak: "break-all",
											}}
										>
											{serviceUriConfig?.proverServerUri || "Not available"}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</>
			)}

			{error && (
				<div className="error-panel">
					<h3>Error</h3>
					<pre>{error instanceof Error ? error.message : String(error)}</pre>
				</div>
			)}
		</div>
	);
}

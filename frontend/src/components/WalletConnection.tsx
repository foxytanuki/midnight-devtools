import { useState, useEffect } from "react";
import type { WalletName, Cip30WalletApi } from "../types/wallet-types";
import { WalletError } from "../types/wallet-types";
import {
	getAvailableWallets,
	connectWallet,
	getAddress,
	getBalance,
	formatAddress,
	saveConnection,
	loadConnection,
	clearConnection,
	getErrorMessage,
} from "../utils/wallet-utils";
import "../App.css";

interface WalletStatus {
	connected: boolean;
	walletName: WalletName | null;
	address: string | null;
	balance: string | null;
	api: Cip30WalletApi | null;
}

interface WalletConnectionProps {
	onConnected?: (
		api: Cip30WalletApi,
		name: WalletName,
		address: string,
	) => void;
	onDisconnected?: () => void;
	onBalanceUpdate?: (balance: string) => void;
}

export function WalletConnection({
	onConnected,
	onDisconnected,
	onBalanceUpdate,
}: WalletConnectionProps) {
	const [wallets, setWallets] = useState(getAvailableWallets());
	const [status, setStatus] = useState<WalletStatus>({
		connected: false,
		walletName: null,
		address: null,
		balance: null,
		api: null,
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>("");
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		const saved = loadConnection();
		if (saved) {
			// Do not auto-reconnect, user must explicitly connect
		}
	}, []);

	useEffect(() => {
		const interval = setInterval(() => {
			setWallets(getAvailableWallets());
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	const handleConnect = async (walletName: WalletName) => {
		setLoading(true);
		setError("");

		try {
			const api = await connectWallet(walletName);
			const address = await getAddress(api);
			const balance = await getBalance(api);

			setStatus({
				connected: true,
				walletName,
				address,
				balance,
				api,
			});

			saveConnection(walletName, address);
			onConnected?.(api, walletName, address);
			onBalanceUpdate?.(balance);
		} catch (err) {
			let errorMessage = "Unknown error occurred";

			if (err instanceof WalletError) {
				errorMessage = getErrorMessage(err.code);
			} else if (err instanceof Error) {
				errorMessage = err.message;
			}

			setError(errorMessage);
			setStatus({
				connected: false,
				walletName: null,
				address: null,
				balance: null,
				api: null,
			});
		} finally {
			setLoading(false);
		}
	};

	const handleDisconnect = () => {
		setStatus({
			connected: false,
			walletName: null,
			address: null,
			balance: null,
			api: null,
		});
		clearConnection();
		setError("");
		onDisconnected?.();
	};

	const handleRefresh = async () => {
		if (!status.api || !status.connected) {
			return;
		}

		setRefreshing(true);
		setError("");

		try {
			const address = await getAddress(status.api);
			const balance = await getBalance(status.api);

			setStatus((prev) => ({
				...prev,
				address,
				balance,
			}));
			onBalanceUpdate?.(balance);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to refresh");
		} finally {
			setRefreshing(false);
		}
	};

	return (
		<div className="method-panel">
			<h2>Wallet Connection</h2>
			<p className="method-description-text">
				Connect to a Midnight Network compatible wallet to verify address and
				balance.
			</p>

			<div className="params-section">
				<h3>Available Wallets</h3>
				<div className="wallet-list">
					{/* Laceを最初に表示 */}
					{wallets
						.filter((wallet) => wallet.name === "lace")
						.map((wallet) => (
							<div key={wallet.name} className="wallet-item">
								<div className="wallet-info">
									<div className="wallet-header">
										{wallet.icon && (
											<img
												src={wallet.icon}
												alt={wallet.displayName}
												className="wallet-icon-small"
											/>
										)}
										<div className="wallet-name">{wallet.displayName}</div>
									</div>
									<div
										className={`wallet-status ${
											wallet.installed ? "installed" : "not-installed"
										}`}
									>
										{wallet.installed ? "Installed" : "Not Installed"}
									</div>
								</div>
								{wallet.installed ? (
									<button
										type="button"
										onClick={() => handleConnect(wallet.name)}
										disabled={
											loading ||
											(status.connected && status.walletName === wallet.name)
										}
										className="wallet-connect-button"
									>
										{status.connected && status.walletName === wallet.name
											? "Connected"
											: "Connect"}
									</button>
								) : (
									<button
										type="button"
										onClick={() => {
											window.open("https://www.lace.io/", "_blank");
										}}
										className="wallet-install-button"
									>
										Install
									</button>
								)}
							</div>
						))}
					{/* YoroiとEternlを薄く表示 */}
					{wallets
						.filter((wallet) => wallet.name === "yoroi" || wallet.name === "eternl")
						.map((wallet) => (
							<div
								key={wallet.name}
								className="wallet-item"
								style={{
									opacity: 0.6,
									filter: "grayscale(0.6)",
								}}
							>
								<div className="wallet-info">
									<div className="wallet-header">
										{wallet.icon && (
											<img
												src={wallet.icon}
												alt={wallet.displayName}
												className="wallet-icon-small"
											/>
										)}
										<div className="wallet-name">{wallet.displayName}</div>
									</div>
									<div
										className={`wallet-status ${
											wallet.installed ? "installed" : "not-installed"
										}`}
									>
										{wallet.installed ? "Installed" : "Not Installed"}
									</div>
									{!wallet.isMidnightNative && (
										<div
											className="wallet-warning"
											style={{
												marginTop: "0.5rem",
												padding: "0.5rem",
												backgroundColor: "rgba(255, 165, 0, 0.1)",
												border: "1px solid rgba(255, 165, 0, 0.3)",
												borderRadius: "4px",
												fontSize: "0.75rem",
												color: "var(--color-text-secondary, #666)",
												width: "fit-content",
												display: "inline-block",
											}}
										>
											Not yet supported on Midnight Network.
										</div>
									)}
								</div>
								{wallet.installed ? (
									<button
										type="button"
										onClick={() => handleConnect(wallet.name)}
										disabled={
											loading ||
											(status.connected && status.walletName === wallet.name)
										}
										className="wallet-connect-button"
									>
										{status.connected && status.walletName === wallet.name
											? "Connected"
											: "Connect"}
									</button>
								) : (
									<button
										type="button"
										onClick={() => {
											const urls: Record<WalletName, string> = {
												lace: "https://www.lace.io/",
												yoroi: "https://yoroi-wallet.com/",
												eternl: "https://eternl.io/",
											};
											window.open(urls[wallet.name], "_blank");
										}}
										className="wallet-install-button"
									>
										Install
									</button>
								)}
							</div>
						))}
				</div>
			</div>

			{status.connected && (
				<div className="params-section">
					<h3>Connection Info</h3>
					<div className="connection-info">
						<div className="info-item">
							<label>Wallet:</label>
							<span>{status.walletName}</span>
						</div>
						<div className="info-item">
							<label>Address:</label>
							<div className="address-display">
								<span className="address-full">{status.address}</span>
								<span className="address-short">
									{status.address ? formatAddress(status.address) : ""}
								</span>
								<button
									type="button"
									onClick={() => {
										if (status.address) {
											navigator.clipboard.writeText(status.address);
										}
									}}
									className="copy-button"
									title="Copy address"
								>
									Copy
								</button>
							</div>
						</div>
						<div className="info-box" style={{ marginTop: "1rem" }}>
							<strong>Why Balance is Not Displayed</strong>
							<br />
							<br />
							Balance information is not displayed because retrieving balance
							through DApp Connector API is{" "}
							<strong>not possible by design</strong> due to Midnight Network's
							privacy protection mechanisms.
							<br />
							<br />
							<strong>Why balance cannot be retrieved:</strong>
							<ul>
								<li>
									<strong>Zswap privacy protection:</strong> Midnight Network
									uses Zswap, a shielded transaction protocol. Shielded address
									balances are only visible to wallets with the corresponding
									viewing key.
								</li>
								<li>
									<strong>DApp Connector API limitations:</strong> The DApp
									Connector API's <code>state()</code> method returns{" "}
									<code>DAppConnectorWalletState</code>, which includes address
									and public keys but{" "}
									<strong>does not include balance information</strong>.
								</li>
								<li>
									<strong>No viewing key access:</strong> DApp Connector API
									does not provide access to viewing keys, which are required to
									query balance information through the Indexer API's wallet
									subscription.
								</li>
								<li>
									<strong>RPC API limitations:</strong> The RPC API does not
									provide methods to directly query address balances for
									shielded addresses.
								</li>
							</ul>
							<br />
							This is an intentional privacy protection design. Balance
							information is only accessible within the wallet SDK itself (
							<code>wallet.state().balances</code>), not through external APIs
							or DApp connections. This ensures that third parties cannot query
							shielded address balances, maintaining user privacy.
						</div>
						<div className="connection-actions">
							<button
								type="button"
								onClick={handleRefresh}
								disabled={refreshing}
								className="refresh-button"
							>
								{refreshing ? "Refreshing..." : "Refresh"}
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
					<pre>{error}</pre>
				</div>
			)}

			<div className="params-section">
				<h3>Usage</h3>
				<ol className="usage-list">
					<li>
						Install a wallet extension (Lace, Yoroi, Eternl, etc.) in your
						browser
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
						Click the "Connect" button on this page to connect your wallet
					</li>
					<li>After connection, your address will be displayed</li>
				</ol>
				<div className="info-box">
					<strong>Note about Proof Server:</strong>
					<br />
					<br />
					Midnight Network uses <strong>proof-based transactions</strong>{" "}
					instead of signatures. When using DApp Connector API's{" "}
					<code>balanceAndProveTransaction()</code> method, the wallet handles
					proof generation internally.
					<br />
					<br />
					Whether the Lace Wallet uses a local Proof Server or handles proof
					generation differently depends on the wallet's implementation. The
					wallet may use its own proof generation service or require a local
					Proof Server.
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

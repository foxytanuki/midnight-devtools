import { useEffect, useState } from "react";
import { useNetwork } from "../contexts/NetworkContext";
import { useWallet } from "../hooks/useWallet";
import { mapToWalletNetworkId } from "../utils/network-config";
import { MidnightBrowserWallet } from "../utils/wallet-controller";
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
		dustBalance,
		unshieldedBalances,
		shieldedBalances,
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

	// 1 NIGHT/tNIGHT = 10^6 STAR (1,000,000 STAR)
	// 1,000,000,000 STAR = 1,000 NIGHT/tNIGHT
	const NIGHT_DECIMALS = 6n;
	const NIGHT_DIVISOR = 10n ** NIGHT_DECIMALS; // 1,000,000
	const MIN_UNIT_NAME = "STAR"; // Atomic unit of NIGHT/tNIGHT

	// 1 tDUST = 10^15 SPECK (1,000,000,000,000,000 SPECK)
	const DUST_DECIMALS = 15n;
	const DUST_DIVISOR = 10n ** DUST_DECIMALS; // 1,000,000,000,000,000

	// ネットワークに応じたトークン名を取得
	const getNativeTokenName = (): string => {
		const networkId = currentNetwork.id;
		if (
			networkId === "midnight-preview" ||
			networkId === "testnet-02" ||
			networkId === "0.18-undeployed1-kitsunesh" ||
			networkId === "localhost"
		) {
			return "tNIGHT";
		}
		return "NIGHT";
	};

	// bigintを数値フォーマット（カンマ区切り）に変換
	const formatBigInt = (value: bigint | undefined): string => {
		if (value === undefined) return "0";
		return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	};

	// STARをNIGHT/tNIGHTに変換してフォーマット（カンマ区切り付き）
	const formatStarToNightWithCommas = (value: bigint | undefined): string => {
		if (value === undefined) return "0";
		const night = Number(value) / Number(NIGHT_DIVISOR);
		// 整数部分をカンマ区切り、小数部分は6桁まで
		const parts = night.toFixed(6).split(".");
		const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		const decimalPart = parts[1].replace(/0+$/, ""); // 末尾の0を削除
		return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
	};

	// SPECKをtDUSTに変換してフォーマット（カンマ区切り付き）
	const formatSpeckToTDustWithCommas = (value: bigint | undefined): string => {
		if (value === undefined) return "0";
		const tDust = Number(value) / Number(DUST_DIVISOR);
		// 整数部分をカンマ区切り、小数部分は6桁まで
		const parts = tDust.toFixed(6).split(".");
		const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		const decimalPart = parts[1].replace(/0+$/, ""); // 末尾の0を削除
		return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
	};

	// トークンタイプを表示名に変換（tNIGHTの場合は短縮表示）
	const formatTokenType = (tokenType: string): string => {
		// すべて0のトークンタイプはtNIGHT
		if (/^0+$/.test(tokenType)) {
			return "tNIGHT";
		}
		// 長い場合は短縮表示
		if (tokenType.length > 16) {
			return `${tokenType.slice(0, 8)}...`;
		}
		return tokenType;
	};

	// トークンバランスをフォーマット
	const formatTokenBalances = (
		balances: Record<string, bigint> | undefined,
	): Array<{
		tokenType: string;
		displayName: string;
		balance: string;
		balanceNight: string;
	}> => {
		if (!balances) return [];
		return Object.entries(balances).map(([tokenType, balance]) => ({
			tokenType,
			displayName: formatTokenType(tokenType),
			balance: formatBigInt(balance),
			balanceNight: formatStarToNightWithCommas(balance),
		}));
	};

	return (
		<div className="method-panel">
			<h2>Wallet Connection</h2>
			<p className="method-description-text">
				Connect your wallet to interact with Midnight Network. The connection
				will automatically restore on page reload.
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
						<h3>Wallet Information</h3>
						<div className="connection-info">
							{unshieldedAddress && (
								<div className="info-item">
									<label>Unshielded Address</label>
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
								<>
									<div className="info-item">
										<label>Shielded Address</label>
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

									{shieldedAddresses.shieldedCoinPublicKey && (
										<div className="info-item">
											<label>Coin Public Key</label>
											<div className="address-display">
												<span className="address-full">
													{shieldedAddresses.shieldedCoinPublicKey}
												</span>
												<button
													type="button"
													onClick={() => {
														navigator.clipboard.writeText(
															shieldedAddresses.shieldedCoinPublicKey,
														);
													}}
													className="copy-button"
													title="Copy coin public key"
												>
													Copy
												</button>
											</div>
										</div>
									)}

									{shieldedAddresses.shieldedEncryptionPublicKey && (
										<div className="info-item">
											<label>Encryption Public Key</label>
											<div className="address-display">
												<span className="address-full">
													{shieldedAddresses.shieldedEncryptionPublicKey}
												</span>
												<button
													type="button"
													onClick={() => {
														navigator.clipboard.writeText(
															shieldedAddresses.shieldedEncryptionPublicKey,
														);
													}}
													className="copy-button"
													title="Copy encryption public key"
												>
													Copy
												</button>
											</div>
										</div>
									)}
								</>
							)}

							{dustAddress && (
								<div className="info-item">
									<label>Dust Address</label>
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

							{dustBalance && (
								<>
									<div className="info-item">
										<label>Dust Balance</label>
										<div
											style={{
												fontSize: "0.9375rem",
												color: "var(--color-text)",
											}}
										>
											{formatSpeckToTDustWithCommas(dustBalance.balance)} tDUST
											<br />
											<span
												style={{
													color: "var(--color-text-secondary)",
													fontSize: "0.75rem",
												}}
											>
												({formatBigInt(dustBalance.balance)} SPECK)
											</span>
										</div>
									</div>
									<div className="info-item">
										<label>Dust Cap</label>
										<div
											style={{
												fontSize: "0.9375rem",
												color: "var(--color-text)",
											}}
										>
											{formatSpeckToTDustWithCommas(dustBalance.cap)} tDUST
											<br />
											<span
												style={{
													color: "var(--color-text-secondary)",
													fontSize: "0.75rem",
												}}
											>
												({formatBigInt(dustBalance.cap)} SPECK)
											</span>
										</div>
									</div>
								</>
							)}

							{(unshieldedBalances || shieldedBalances) && (
								<div className="info-item">
									<label>Balances</label>
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											gap: "0.75rem",
											marginTop: "0.5rem",
										}}
									>
										{formatTokenBalances(unshieldedBalances).length > 0 && (
											<div
												style={{
													padding: "0.5rem",
													backgroundColor: "var(--color-surface)",
													borderRadius: "2px",
												}}
											>
												<div
													style={{
														fontSize: "0.75rem",
														color: "var(--color-text-secondary)",
														marginBottom: "0.25rem",
													}}
												>
													Unshielded
												</div>
												{formatTokenBalances(unshieldedBalances).map(
													({
														tokenType,
														displayName,
														balance,
														balanceNight,
													}) => (
														<div
															key={tokenType}
															style={{
																fontSize: "0.8125rem",
																color: "var(--color-text)",
															}}
														>
															{displayName}: {balanceNight}{" "}
															{getNativeTokenName()}
															<br />
															<span
																style={{
																	color: "var(--color-text-secondary)",
																	fontSize: "0.75rem",
																}}
															>
																({balance}{" "}
																<span style={{ fontSize: "0.6875rem" }}>
																	{MIN_UNIT_NAME}
																</span>
																)
															</span>
														</div>
													),
												)}
											</div>
										)}
										{formatTokenBalances(shieldedBalances).length > 0 && (
											<div
												style={{
													padding: "0.5rem",
													backgroundColor: "var(--color-surface)",
													borderRadius: "2px",
												}}
											>
												<div
													style={{
														fontSize: "0.75rem",
														color: "var(--color-text-secondary)",
														marginBottom: "0.25rem",
													}}
												>
													Shielded
												</div>
												{formatTokenBalances(shieldedBalances).map(
													({
														tokenType,
														displayName,
														balance,
														balanceNight,
													}) => (
														<div
															key={tokenType}
															style={{
																fontSize: "0.8125rem",
																color: "var(--color-text)",
															}}
														>
															{displayName}: {balanceNight}{" "}
															{getNativeTokenName()}
															<br />
															<span
																style={{
																	color: "var(--color-text-secondary)",
																	fontSize: "0.75rem",
																}}
															>
																({balance}{" "}
																<span style={{ fontSize: "0.6875rem" }}>
																	{MIN_UNIT_NAME}
																</span>
																)
															</span>
														</div>
													),
												)}
											</div>
										)}
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
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
										marginBottom: "0.5rem",
									}}
								>
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
									<span
										style={{
											color:
												status?.status === "connected"
													? "var(--color-success)"
													: "var(--color-text)",
										}}
									>
										{status?.status === "connected"
											? "Connected"
											: "Disconnected"}
									</span>
								</div>
								{status?.status === "connected" && (
									<div
										style={{
											marginLeft: "1rem",
											fontSize: "0.8125rem",
											color: "var(--color-text-secondary)",
											marginBottom: "0.25rem",
										}}
									>
										Network: <strong>{status?.networkId}</strong>
									</div>
								)}
								{initialAPI && (
									<div
										style={{
											marginLeft: "1rem",
											fontSize: "0.8125rem",
											color: "var(--color-text-secondary)",
										}}
									>
										Wallet: <strong>{initialAPI.name || "Unknown"}</strong>
									</div>
								)}
							</div>

							<div className="info-item">
								<label>Proof Server</label>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
									}}
								>
									<div
										style={{
											width: "8px",
											height: "8px",
											borderRadius: "50%",
											backgroundColor:
												proofServerOnline === undefined
													? "var(--color-text-muted)"
													: proofServerOnline
														? "var(--color-success)"
														: "var(--color-error)",
										}}
									/>
									<span
										style={{
											color:
												proofServerOnline === undefined
													? "var(--color-text)"
													: proofServerOnline
														? "var(--color-success)"
														: "var(--color-error)",
										}}
									>
										{proofServerOnline === undefined
											? "Unknown"
											: proofServerOnline
												? "Online"
												: "Offline"}
									</span>
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
											padding: "0.5rem",
											backgroundColor: "var(--color-surface)",
											borderRadius: "2px",
										}}
									>
										<div
											style={{
												fontSize: "0.75rem",
												color: "var(--color-text-secondary)",
												marginBottom: "0.25rem",
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
											padding: "0.5rem",
											backgroundColor: "var(--color-surface)",
											borderRadius: "2px",
										}}
									>
										<div
											style={{
												fontSize: "0.75rem",
												color: "var(--color-text-secondary)",
												marginBottom: "0.25rem",
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
											padding: "0.5rem",
											backgroundColor: "var(--color-surface)",
											borderRadius: "2px",
										}}
									>
										<div
											style={{
												fontSize: "0.75rem",
												color: "var(--color-text-secondary)",
												marginBottom: "0.25rem",
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
											padding: "0.5rem",
											backgroundColor: "var(--color-surface)",
											borderRadius: "2px",
										}}
									>
										<div
											style={{
												fontSize: "0.75rem",
												color: "var(--color-text-secondary)",
												marginBottom: "0.25rem",
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

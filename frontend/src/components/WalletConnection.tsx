import { useEffect, useState } from "react";
import { useNetwork } from "../contexts/NetworkContext";
import { useWallet } from "../hooks/useWallet";
import { mapToWalletNetworkId } from "../utils/network-config";
import { MidnightBrowserWallet } from "../utils/wallet-controller";
import {
	Wallet,
	Eye,
	Shield,
	Fuel,
	Key,
	RefreshCw,
	LogOut,
	Copy,
	Globe,
	Server,
	Radio,
	Plug,
	Lock,
	Activity,
} from "lucide-react";
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
					{/* Wallet Information Section */}
					<div className="params-section">
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								marginBottom: "0.75rem",
							}}
						>
							<h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
								<Wallet size={18} />
								Wallet Information
							</h3>
							<div style={{ display: "flex", gap: "0.5rem" }}>
								<button
									type="button"
									onClick={handleRefresh}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.375rem",
										padding: "0.375rem 0.75rem",
										background: "var(--color-surface)",
										color: "var(--color-text)",
										border: "1px solid var(--color-border)",
										borderRadius: "2px",
										fontSize: "0.8125rem",
										fontWeight: "500",
										cursor: "pointer",
										transition: "all 0.15s ease",
									}}
									title="Refresh wallet data"
								>
									<RefreshCw size={14} />
									Refresh
								</button>
								<button
									type="button"
									onClick={handleDisconnect}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.375rem",
										padding: "0.375rem 0.75rem",
										background: "transparent",
										color: "var(--color-error)",
										border: "1px solid var(--color-error)",
										borderRadius: "2px",
										fontSize: "0.8125rem",
										fontWeight: "500",
										cursor: "pointer",
										transition: "all 0.15s ease",
									}}
									title="Disconnect wallet"
								>
									<LogOut size={14} />
									Disconnect
								</button>
							</div>
						</div>

						{/* Balances Overview Card */}
						{(unshieldedBalances || shieldedBalances || dustBalance) && (
							<div
								style={{
									background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
									borderRadius: "2px",
									padding: "1.5rem",
									marginBottom: "1rem",
									color: "#fff",
								}}
							>
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
										gap: "1.5rem",
									}}
								>
									{/* Unshielded Balance */}
									{formatTokenBalances(unshieldedBalances).length > 0 && (
										<div>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: "0.5rem",
													marginBottom: "0.5rem",
												}}
											>
												<Eye size={16} color="#00cc66" />
												<span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
													Unshielded
												</span>
											</div>
											{formatTokenBalances(unshieldedBalances).map(({ tokenType, balanceNight }) => (
												<div key={tokenType}>
													<div style={{ fontSize: "1.75rem", fontWeight: "700", letterSpacing: "-0.5px" }}>
														{balanceNight}
													</div>
													<div style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)" }}>
														{getNativeTokenName()}
													</div>
												</div>
											))}
										</div>
									)}

									{/* Shielded Balance */}
									{formatTokenBalances(shieldedBalances).length > 0 && (
										<div>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: "0.5rem",
													marginBottom: "0.5rem",
												}}
											>
												<Shield size={16} color="#0000fe" />
												<span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
													Shielded
												</span>
											</div>
											{formatTokenBalances(shieldedBalances).map(({ tokenType, balanceNight }) => (
												<div key={tokenType}>
													<div style={{ fontSize: "1.75rem", fontWeight: "700", letterSpacing: "-0.5px" }}>
														{balanceNight}
													</div>
													<div style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)" }}>
														{getNativeTokenName()}
													</div>
												</div>
											))}
										</div>
									)}

									{/* Dust Balance */}
									{dustBalance && (
										<div>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: "0.5rem",
													marginBottom: "0.5rem",
												}}
											>
												<Fuel size={16} color="#ff9900" />
												<span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
													Dust
												</span>
											</div>
											<div style={{ fontSize: "1.75rem", fontWeight: "700", letterSpacing: "-0.5px" }}>
												{formatSpeckToTDustWithCommas(dustBalance.balance)}
											</div>
											<div style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)" }}>
												tDUST
											</div>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Address Cards Grid */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
								gap: "1rem",
								marginBottom: "1rem",
							}}
						>
							{/* Unshielded Address Card */}
							{unshieldedAddress && (
								<div
									style={{
										background: "var(--color-surface)",
										border: "1px solid var(--color-border)",
										borderRadius: "2px",
										padding: "1rem",
										transition: "all 0.2s ease",
									}}
								>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											marginBottom: "0.75rem",
										}}
									>
										<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
											<div
												style={{
													width: "32px",
													height: "32px",
													borderRadius: "2px",
													background: "linear-gradient(135deg, #00cc66 0%, #00994d 100%)",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
												}}
											>
												<Eye size={16} color="#fff" />
											</div>
											<div>
												<div style={{ fontWeight: "600", fontSize: "0.875rem" }}>Unshielded</div>
												<div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Public Address</div>
											</div>
										</div>
										<button
											type="button"
											onClick={() => navigator.clipboard.writeText(unshieldedAddress.unshieldedAddress)}
											style={{
												background: "var(--color-bg)",
												border: "1px solid var(--color-border)",
												borderRadius: "2px",
												padding: "0.375rem 0.75rem",
												cursor: "pointer",
												display: "flex",
												alignItems: "center",
												gap: "0.25rem",
												fontSize: "0.8125rem",
												transition: "all 0.15s ease",
											}}
											title="Copy address"
										>
											<Copy size={14} />
											Copy
										</button>
									</div>
									<div
										style={{
											fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
											fontSize: "0.75rem",
											color: "var(--color-text)",
											wordBreak: "break-all",
											background: "var(--color-bg)",
											padding: "0.75rem",
											borderRadius: "2px",
											lineHeight: "1.5",
										}}
									>
										{unshieldedAddress.unshieldedAddress}
									</div>
								</div>
							)}

							{/* Shielded Address Card */}
							{shieldedAddresses && (
								<div
									style={{
										background: "var(--color-surface)",
										border: "1px solid var(--color-border)",
										borderRadius: "2px",
										padding: "1rem",
										transition: "all 0.2s ease",
									}}
								>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											marginBottom: "0.75rem",
										}}
									>
										<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
											<div
												style={{
													width: "32px",
													height: "32px",
													borderRadius: "2px",
													background: "linear-gradient(135deg, #0000fe 0%, #0000cb 100%)",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
												}}
											>
												<Shield size={16} color="#fff" />
											</div>
											<div>
												<div style={{ fontWeight: "600", fontSize: "0.875rem" }}>Shielded</div>
												<div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Private Address</div>
											</div>
										</div>
										<button
											type="button"
											onClick={() => navigator.clipboard.writeText(shieldedAddresses.shieldedAddress)}
											style={{
												background: "var(--color-bg)",
												border: "1px solid var(--color-border)",
												borderRadius: "2px",
												padding: "0.375rem 0.75rem",
												cursor: "pointer",
												display: "flex",
												alignItems: "center",
												gap: "0.25rem",
												fontSize: "0.8125rem",
												transition: "all 0.15s ease",
											}}
											title="Copy address"
										>
											<Copy size={14} />
											Copy
										</button>
									</div>
									<div
										style={{
											fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
											fontSize: "0.75rem",
											color: "var(--color-text)",
											wordBreak: "break-all",
											background: "var(--color-bg)",
											padding: "0.75rem",
											borderRadius: "2px",
											lineHeight: "1.5",
										}}
									>
										{shieldedAddresses.shieldedAddress}
									</div>
								</div>
							)}

							{/* Dust Address Card */}
							{dustAddress && (
								<div
									style={{
										background: "var(--color-surface)",
										border: "1px solid var(--color-border)",
										borderRadius: "2px",
										padding: "1rem",
										transition: "all 0.2s ease",
									}}
								>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											marginBottom: "0.75rem",
										}}
									>
										<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
											<div
												style={{
													width: "32px",
													height: "32px",
													borderRadius: "2px",
													background: "linear-gradient(135deg, #ff9900 0%, #cc7a00 100%)",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
												}}
											>
												<Fuel size={16} color="#fff" />
											</div>
											<div>
												<div style={{ fontWeight: "600", fontSize: "0.875rem" }}>Dust</div>
												<div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Gas Address</div>
											</div>
										</div>
										<button
											type="button"
											onClick={() => navigator.clipboard.writeText(dustAddress.dustAddress)}
											style={{
												background: "var(--color-bg)",
												border: "1px solid var(--color-border)",
												borderRadius: "2px",
												padding: "0.375rem 0.75rem",
												cursor: "pointer",
												display: "flex",
												alignItems: "center",
												gap: "0.25rem",
												fontSize: "0.8125rem",
												transition: "all 0.15s ease",
											}}
											title="Copy address"
										>
											<Copy size={14} />
											Copy
										</button>
									</div>
									<div
										style={{
											fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
											fontSize: "0.75rem",
											color: "var(--color-text)",
											wordBreak: "break-all",
											background: "var(--color-bg)",
											padding: "0.75rem",
											borderRadius: "2px",
											lineHeight: "1.5",
										}}
									>
										{dustAddress.dustAddress}
									</div>
								</div>
							)}
						</div>

						{/* Public Keys Section (Collapsible style) */}
						{shieldedAddresses?.shieldedCoinPublicKey && (
							<div
								style={{
									background: "var(--color-surface)",
									border: "1px solid var(--color-border)",
									borderRadius: "2px",
									padding: "1rem",
									marginBottom: "1rem",
								}}
							>
								<div style={{ fontWeight: "600", fontSize: "0.875rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
									<Key size={16} />
									Public Keys
								</div>
								<div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
									<div>
										<div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: "0.375rem" }}>
											Coin Public Key
										</div>
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
												background: "var(--color-bg)",
												padding: "0.625rem 0.75rem",
												borderRadius: "2px",
											}}
										>
											<span
												style={{
													fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
													fontSize: "0.75rem",
													color: "var(--color-text)",
													wordBreak: "break-all",
													flex: 1,
												}}
											>
												{shieldedAddresses.shieldedCoinPublicKey}
											</span>
											<button
												type="button"
												onClick={() => navigator.clipboard.writeText(shieldedAddresses.shieldedCoinPublicKey)}
												style={{
													background: "transparent",
													border: "none",
													cursor: "pointer",
													padding: "0.25rem",
													display: "flex",
													color: "var(--color-text-secondary)",
												}}
												title="Copy"
											>
												<Copy size={14} />
											</button>
										</div>
									</div>
									{shieldedAddresses.shieldedEncryptionPublicKey && (
										<div>
											<div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: "0.375rem" }}>
												Encryption Public Key
											</div>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: "0.5rem",
													background: "var(--color-bg)",
													padding: "0.625rem 0.75rem",
													borderRadius: "2px",
												}}
											>
												<span
													style={{
														fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
														fontSize: "0.75rem",
														color: "var(--color-text)",
														wordBreak: "break-all",
														flex: 1,
													}}
												>
													{shieldedAddresses.shieldedEncryptionPublicKey}
												</span>
												<button
													type="button"
													onClick={() => navigator.clipboard.writeText(shieldedAddresses.shieldedEncryptionPublicKey)}
													style={{
														background: "transparent",
														border: "none",
														cursor: "pointer",
														padding: "0.25rem",
														display: "flex",
														color: "var(--color-text-secondary)",
													}}
													title="Copy"
												>
													<Copy size={14} />
												</button>
											</div>
										</div>
									)}
								</div>
							</div>
						)}

					</div>

					{/* Connection Details Section */}
					<div className="params-section">
						<h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
							<Activity size={18} />
							Connection Details
						</h3>

						{/* Status Cards Row */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
								gap: "1rem",
								marginBottom: "1rem",
							}}
						>
							{/* Wallet Status Card */}
							<div
								style={{
									background: "var(--color-surface)",
									border: "1px solid var(--color-border)",
									borderRadius: "2px",
									padding: "1rem",
								}}
							>
								<div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
									Wallet Status
								</div>
								<div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
									<div
										style={{
											width: "12px",
											height: "12px",
											borderRadius: "50%",
											backgroundColor: status?.status === "connected" ? "var(--color-success)" : "var(--color-text-muted)",
											boxShadow: status?.status === "connected" ? "0 0 8px rgba(0, 204, 102, 0.5)" : "none",
										}}
									/>
									<div>
										<div style={{ fontWeight: "600", fontSize: "0.9375rem", color: status?.status === "connected" ? "var(--color-success)" : "var(--color-text)" }}>
											{status?.status === "connected" ? "Connected" : "Disconnected"}
										</div>
										{initialAPI && (
											<div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
												{initialAPI.name || "Unknown Wallet"}
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Network Card */}
							{status?.status === "connected" && (
								<div
									style={{
										background: "var(--color-surface)",
										border: "1px solid var(--color-border)",
										borderRadius: "2px",
										padding: "1rem",
									}}
								>
									<div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
										Network
									</div>
									<div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
										<div
											style={{
												width: "32px",
												height: "32px",
												borderRadius: "2px",
												background: "linear-gradient(135deg, #1a1a1a 0%, #333 100%)",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
											}}
										>
											<Globe size={16} color="#fff" />
										</div>
										<div style={{ fontWeight: "600", fontSize: "0.9375rem" }}>
											{status?.networkId}
										</div>
									</div>
								</div>
							)}

							{/* Proof Server Card */}
							<div
								style={{
									background: "var(--color-surface)",
									border: "1px solid var(--color-border)",
									borderRadius: "2px",
									padding: "1rem",
								}}
							>
								<div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
									Proof Server
								</div>
								<div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
									<div
										style={{
											width: "12px",
											height: "12px",
											borderRadius: "50%",
											backgroundColor:
												proofServerOnline === undefined
													? "var(--color-text-muted)"
													: proofServerOnline
														? "var(--color-success)"
														: "var(--color-error)",
											boxShadow:
												proofServerOnline === true
													? "0 0 8px rgba(0, 204, 102, 0.5)"
													: proofServerOnline === false
														? "0 0 8px rgba(204, 0, 0, 0.5)"
														: "none",
										}}
									/>
									<div
										style={{
											fontWeight: "600",
											fontSize: "0.9375rem",
											color:
												proofServerOnline === undefined
													? "var(--color-text)"
													: proofServerOnline
														? "var(--color-success)"
														: "var(--color-error)",
										}}
									>
										{proofServerOnline === undefined ? "Unknown" : proofServerOnline ? "Online" : "Offline"}
									</div>
								</div>
							</div>
						</div>

						{/* Network Endpoints */}
						<div
							style={{
								background: "var(--color-surface)",
								border: "1px solid var(--color-border)",
								borderRadius: "2px",
								padding: "1rem",
							}}
						>
							<div
								style={{
									fontSize: "0.875rem",
									fontWeight: "600",
									marginBottom: "1rem",
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
								}}
							>
								<Server size={16} />
								Network Endpoints
							</div>
							<div style={{ display: "grid", gap: "0.75rem" }}>
								<div
									style={{
										display: "flex",
										alignItems: "flex-start",
										gap: "0.75rem",
										padding: "0.75rem",
										background: "var(--color-bg)",
										borderRadius: "2px",
									}}
								>
									<Globe size={16} style={{ marginTop: "2px", flexShrink: 0, color: "var(--color-text-secondary)" }} />
									<div style={{ flex: 1, minWidth: 0 }}>
										<div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>
											Substrate Node
										</div>
										<div
											style={{
												fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
												fontSize: "0.8125rem",
												color: serviceUriConfig?.substrateNodeUri ? "var(--color-text)" : "var(--color-text-muted)",
												wordBreak: "break-all",
											}}
										>
											{serviceUriConfig?.substrateNodeUri || "Not available"}
										</div>
									</div>
								</div>
								<div
									style={{
										display: "flex",
										alignItems: "flex-start",
										gap: "0.75rem",
										padding: "0.75rem",
										background: "var(--color-bg)",
										borderRadius: "2px",
									}}
								>
									<Radio size={16} style={{ marginTop: "2px", flexShrink: 0, color: "var(--color-text-secondary)" }} />
									<div style={{ flex: 1, minWidth: 0 }}>
										<div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>
											Indexer (REST)
										</div>
										<div
											style={{
												fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
												fontSize: "0.8125rem",
												color: serviceUriConfig?.indexerUri ? "var(--color-text)" : "var(--color-text-muted)",
												wordBreak: "break-all",
											}}
										>
											{serviceUriConfig?.indexerUri || "Not available"}
										</div>
									</div>
								</div>
								<div
									style={{
										display: "flex",
										alignItems: "flex-start",
										gap: "0.75rem",
										padding: "0.75rem",
										background: "var(--color-bg)",
										borderRadius: "2px",
									}}
								>
									<Plug size={16} style={{ marginTop: "2px", flexShrink: 0, color: "var(--color-text-secondary)" }} />
									<div style={{ flex: 1, minWidth: 0 }}>
										<div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>
											Indexer (WebSocket)
										</div>
										<div
											style={{
												fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
												fontSize: "0.8125rem",
												color: serviceUriConfig?.indexerWsUri ? "var(--color-text)" : "var(--color-text-muted)",
												wordBreak: "break-all",
											}}
										>
											{serviceUriConfig?.indexerWsUri || "Not available"}
										</div>
									</div>
								</div>
								<div
									style={{
										display: "flex",
										alignItems: "flex-start",
										gap: "0.75rem",
										padding: "0.75rem",
										background: "var(--color-bg)",
										borderRadius: "2px",
									}}
								>
									<Lock size={16} style={{ marginTop: "2px", flexShrink: 0, color: "var(--color-text-secondary)" }} />
									<div style={{ flex: 1, minWidth: 0 }}>
										<div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>
											Proof Server
										</div>
										<div
											style={{
												fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
												fontSize: "0.8125rem",
												color: serviceUriConfig?.proverServerUri ? "var(--color-text)" : "var(--color-text-muted)",
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

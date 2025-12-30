import {
	Activity,
	Check,
	Copy,
	Eye,
	Fuel,
	Globe,
	Key,
	LogOut,
	RefreshCw,
	Server,
	Shield,
	Wallet,
} from "lucide-react";
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
	const [copiedKey, setCopiedKey] = useState<string | null>(null);

	// コピー関数（フィードバック付き）
	const handleCopy = (text: string, key: string) => {
		navigator.clipboard.writeText(text);
		setCopiedKey(key);
		setTimeout(() => setCopiedKey(null), 1500);
	};

	// コピーボタンコンポーネント
	const CopyButton = ({
		text,
		copyKey,
		size = 14,
	}: {
		text: string;
		copyKey: string;
		size?: number;
	}) => {
		const isCopied = copiedKey === copyKey;
		return (
			<button
				type="button"
				onClick={() => handleCopy(text, copyKey)}
				style={{
					background: "transparent",
					border: "none",
					cursor: "pointer",
					padding: "0.25rem",
					display: "flex",
					color: isCopied
						? "var(--color-success)"
						: "var(--color-text-secondary)",
					transition: "color 0.15s ease",
				}}
				title={isCopied ? "Copied!" : "Copy"}
			>
				{isCopied ? <Check size={size} /> : <Copy size={size} />}
			</button>
		);
	};

	// エンドポイント行コンポーネント
	const EndpointRow = ({
		label,
		value,
		copyKey,
	}: {
		label: string;
		value: string | undefined;
		copyKey: string;
	}) => (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: "0.5rem",
				background: "var(--color-bg)",
				padding: "0.375rem 0.5rem",
				borderRadius: "2px",
			}}
		>
			<span
				style={{
					fontSize: "0.75rem",
					color: "var(--color-text-secondary)",
					minWidth: "75px",
				}}
			>
				{label}
			</span>
			<span
				style={{
					fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
					fontSize: "0.6875rem",
					color: value ? "var(--color-text)" : "var(--color-text-muted)",
					wordBreak: "break-all",
					flex: 1,
				}}
			>
				{value || "N/A"}
			</span>
			{value && <CopyButton text={value} copyKey={copyKey} size={12} />}
		</div>
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

	// SPECKをtDUSTに変換して短縮形式でフォーマット（cap用）
	const formatSpeckToTDustShort = (value: bigint | undefined): string => {
		if (value === undefined) return "0";
		const tDust = Number(value) / Number(DUST_DIVISOR);

		if (tDust >= 1000000) {
			return `${(tDust / 1000000).toFixed(1)}M`;
		} else if (tDust >= 1000) {
			return `${(tDust / 1000).toFixed(1)}k`;
		}
		return tDust.toFixed(0);
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
							<h3
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
									margin: 0,
								}}
							>
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
									background:
										"linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
									borderRadius: "2px",
									padding: "0.875rem 1rem",
									marginBottom: "0.75rem",
									color: "#fff",
								}}
							>
								<div
									style={{
										display: "flex",
										flexWrap: "wrap",
										gap: "2rem",
									}}
								>
									{/* Unshielded Balance */}
									{formatTokenBalances(unshieldedBalances).length > 0 && (
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
											}}
										>
											<Eye size={16} color="#00cc66" />
											<span
												style={{
													fontSize: "0.8125rem",
													color: "rgba(255,255,255,0.6)",
													textTransform: "uppercase",
													letterSpacing: "0.5px",
												}}
											>
												Unshielded
											</span>
											{formatTokenBalances(unshieldedBalances).map(
												({ tokenType, balanceNight }) => (
													<div
														key={tokenType}
														style={{
															display: "flex",
															alignItems: "baseline",
															gap: "0.375rem",
															marginLeft: "0.375rem",
														}}
													>
														<span
															style={{ fontSize: "1.5rem", fontWeight: "700" }}
														>
															{balanceNight}
														</span>
														<span
															style={{
																fontSize: "0.875rem",
																color: "rgba(255,255,255,0.5)",
															}}
														>
															{getNativeTokenName()}
														</span>
													</div>
												),
											)}
										</div>
									)}

									{/* Shielded Balance */}
									{formatTokenBalances(shieldedBalances).length > 0 && (
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
											}}
										>
											<Shield size={16} color="#0000fe" />
											<span
												style={{
													fontSize: "0.8125rem",
													color: "rgba(255,255,255,0.6)",
													textTransform: "uppercase",
													letterSpacing: "0.5px",
												}}
											>
												Shielded
											</span>
											{formatTokenBalances(shieldedBalances).map(
												({ tokenType, balanceNight }) => (
													<div
														key={tokenType}
														style={{
															display: "flex",
															alignItems: "baseline",
															gap: "0.375rem",
															marginLeft: "0.375rem",
														}}
													>
														<span
															style={{ fontSize: "1.5rem", fontWeight: "700" }}
														>
															{balanceNight}
														</span>
														<span
															style={{
																fontSize: "0.875rem",
																color: "rgba(255,255,255,0.5)",
															}}
														>
															{getNativeTokenName()}
														</span>
													</div>
												),
											)}
										</div>
									)}

									{/* Dust Balance */}
									{dustBalance && (
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
											}}
										>
											<Fuel size={16} color="#ff9900" />
											<span
												style={{
													fontSize: "0.8125rem",
													color: "rgba(255,255,255,0.6)",
													textTransform: "uppercase",
													letterSpacing: "0.5px",
												}}
											>
												Dust
											</span>
											<div
												style={{
													display: "flex",
													alignItems: "baseline",
													gap: "0.375rem",
													marginLeft: "0.375rem",
												}}
											>
												<span style={{ fontSize: "1.5rem", fontWeight: "700" }}>
													{formatSpeckToTDustWithCommas(dustBalance.balance)}
												</span>
												<span
													style={{
														fontSize: "0.875rem",
														color: "rgba(255,255,255,0.5)",
													}}
												>
													/ {formatSpeckToTDustShort(dustBalance.cap)} tDUST
												</span>
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
								gap: "0.625rem",
								marginBottom: "0.625rem",
							}}
						>
							{/* Unshielded Address Card */}
							{unshieldedAddress && (
								<div
									style={{
										background: "var(--color-surface)",
										border: "1px solid var(--color-border)",
										borderRadius: "2px",
										padding: "0.625rem 0.75rem",
									}}
								>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											marginBottom: "0.5rem",
										}}
									>
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
											}}
										>
											<Eye size={14} color="#00cc66" />
											<span
												style={{ fontWeight: "600", fontSize: "0.8125rem" }}
											>
												Unshielded
											</span>
											<span
												style={{
													fontSize: "0.75rem",
													color: "var(--color-text-secondary)",
												}}
											>
												Public
											</span>
										</div>
										<CopyButton
											text={unshieldedAddress.unshieldedAddress}
											copyKey="unshielded"
											size={14}
										/>
									</div>
									<div
										style={{
											fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
											fontSize: "0.75rem",
											color: "var(--color-text)",
											wordBreak: "break-all",
											background: "var(--color-bg)",
											padding: "0.5rem",
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
										padding: "0.625rem 0.75rem",
									}}
								>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											marginBottom: "0.5rem",
										}}
									>
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
											}}
										>
											<Shield size={14} color="#0000fe" />
											<span
												style={{ fontWeight: "600", fontSize: "0.8125rem" }}
											>
												Shielded
											</span>
											<span
												style={{
													fontSize: "0.75rem",
													color: "var(--color-text-secondary)",
												}}
											>
												Private
											</span>
										</div>
										<CopyButton
											text={shieldedAddresses.shieldedAddress}
											copyKey="shielded"
											size={14}
										/>
									</div>
									<div
										style={{
											fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
											fontSize: "0.75rem",
											color: "var(--color-text)",
											wordBreak: "break-all",
											background: "var(--color-bg)",
											padding: "0.5rem",
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
										padding: "0.625rem 0.75rem",
									}}
								>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											marginBottom: "0.5rem",
										}}
									>
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
											}}
										>
											<Fuel size={14} color="#ff9900" />
											<span
												style={{ fontWeight: "600", fontSize: "0.8125rem" }}
											>
												Dust
											</span>
											<span
												style={{
													fontSize: "0.75rem",
													color: "var(--color-text-secondary)",
												}}
											>
												Gas
											</span>
										</div>
										<CopyButton
											text={dustAddress.dustAddress}
											copyKey="dust"
											size={14}
										/>
									</div>
									<div
										style={{
											fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
											fontSize: "0.75rem",
											color: "var(--color-text)",
											wordBreak: "break-all",
											background: "var(--color-bg)",
											padding: "0.5rem",
											borderRadius: "2px",
											lineHeight: "1.5",
										}}
									>
										{dustAddress.dustAddress}
									</div>
								</div>
							)}
						</div>

						{/* Public Keys Section */}
						{shieldedAddresses?.shieldedCoinPublicKey && (
							<div
								style={{
									background: "var(--color-surface)",
									border: "1px solid var(--color-border)",
									borderRadius: "2px",
									padding: "0.625rem 0.75rem",
								}}
							>
								<div
									style={{
										fontWeight: "600",
										fontSize: "0.8125rem",
										marginBottom: "0.5rem",
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
									}}
								>
									<Key size={14} />
									Public Keys
								</div>
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										gap: "0.375rem",
									}}
								>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: "0.5rem",
											background: "var(--color-bg)",
											padding: "0.375rem 0.5rem",
											borderRadius: "2px",
										}}
									>
										<span
											style={{
												fontSize: "0.75rem",
												color: "var(--color-text-secondary)",
												minWidth: "75px",
											}}
										>
											Coin
										</span>
										<span
											style={{
												fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
												fontSize: "0.6875rem",
												color: "var(--color-text)",
												wordBreak: "break-all",
												flex: 1,
											}}
										>
											{shieldedAddresses.shieldedCoinPublicKey}
										</span>
										<CopyButton
											text={shieldedAddresses.shieldedCoinPublicKey}
											copyKey="coinPubKey"
											size={12}
										/>
									</div>
									{shieldedAddresses.shieldedEncryptionPublicKey && (
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
												background: "var(--color-bg)",
												padding: "0.375rem 0.5rem",
												borderRadius: "2px",
											}}
										>
											<span
												style={{
													fontSize: "0.75rem",
													color: "var(--color-text-secondary)",
													minWidth: "75px",
												}}
											>
												Encryption
											</span>
											<span
												style={{
													fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
													fontSize: "0.6875rem",
													color: "var(--color-text)",
													wordBreak: "break-all",
													flex: 1,
												}}
											>
												{shieldedAddresses.shieldedEncryptionPublicKey}
											</span>
											<CopyButton
												text={shieldedAddresses.shieldedEncryptionPublicKey}
												copyKey="encPubKey"
												size={12}
											/>
										</div>
									)}
								</div>
							</div>
						)}
					</div>

					{/* Connection Details Section */}
					<div className="params-section">
						<h3
							style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
						>
							<Activity size={18} />
							Connection Details
						</h3>

						{/* Status Row - Inline */}
						<div
							style={{
								display: "flex",
								flexWrap: "wrap",
								gap: "1.5rem",
								marginBottom: "0.75rem",
								padding: "0.625rem 0.75rem",
								background: "var(--color-surface)",
								border: "1px solid var(--color-border)",
								borderRadius: "2px",
							}}
						>
							{/* Wallet Status */}
							<div
								style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
							>
								<div
									style={{
										width: "10px",
										height: "10px",
										borderRadius: "50%",
										backgroundColor:
											status?.status === "connected"
												? "var(--color-success)"
												: "var(--color-text-muted)",
										boxShadow:
											status?.status === "connected"
												? "0 0 6px rgba(0, 204, 102, 0.5)"
												: "none",
									}}
								/>
								<span style={{ fontSize: "0.8125rem", fontWeight: "600" }}>
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
									{initialAPI && (
										<span style={{ color: "var(--color-text)" }}>
											{`: ${initialAPI.name || "Unknown"}`}
										</span>
									)}
								</span>
							</div>

							{/* Network */}
							{status?.status === "connected" && (
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
									}}
								>
									<Globe size={14} color="var(--color-text-secondary)" />
									<span
										style={{
											fontSize: "0.8125rem",
											color: "var(--color-text-secondary)",
										}}
									>
										Network:
									</span>
									<span style={{ fontSize: "0.8125rem", fontWeight: "600" }}>
										{status?.networkId}
									</span>
								</div>
							)}

							{/* Proof Server */}
							<div
								style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
							>
								<div
									style={{
										width: "10px",
										height: "10px",
										borderRadius: "50%",
										backgroundColor:
											proofServerOnline === undefined
												? "var(--color-text-muted)"
												: proofServerOnline
													? "var(--color-success)"
													: "var(--color-error)",
										boxShadow:
											proofServerOnline === true
												? "0 0 6px rgba(0, 204, 102, 0.5)"
												: proofServerOnline === false
													? "0 0 6px rgba(204, 0, 0, 0.5)"
													: "none",
									}}
								/>
								<span
									style={{
										fontSize: "0.8125rem",
										color: "var(--color-text-secondary)",
									}}
								>
									Proof Server:
								</span>
								<span
									style={{
										fontSize: "0.8125rem",
										fontWeight: "600",
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

						{/* Network Endpoints */}
						<div
							style={{
								background: "var(--color-surface)",
								border: "1px solid var(--color-border)",
								borderRadius: "2px",
								padding: "0.625rem 0.75rem",
							}}
						>
							<div
								style={{
									fontSize: "0.8125rem",
									fontWeight: "600",
									marginBottom: "0.5rem",
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
								}}
							>
								<Server size={14} />
								Network Endpoints
							</div>
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "0.375rem",
								}}
							>
								<EndpointRow
									label="Node"
									value={serviceUriConfig?.substrateNodeUri}
									copyKey="node"
								/>
								<EndpointRow
									label="Prover"
									value={serviceUriConfig?.proverServerUri}
									copyKey="prover"
								/>
								<EndpointRow
									label="Indexer"
									value={serviceUriConfig?.indexerUri}
									copyKey="indexer"
								/>
								<EndpointRow
									label="Indexer WS"
									value={serviceUriConfig?.indexerWsUri}
									copyKey="indexerWs"
								/>
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

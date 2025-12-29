import { useEffect, useState } from "react";
import type { Cip30WalletApi, WalletName } from "../types/wallet-types";
import { formatAddress, getBalance } from "../utils/wallet-utils";
// Contract操作系は一旦無効化（WASM関連のビルドエラー回避のため）
// import { CounterContractPanel } from "./CounterContractPanel";
import { AddressesPanel } from "./AddressesPanel";
import { SignDataPanel } from "./SignDataPanel";
import { TransactionHistoryPanel } from "./TransactionHistoryPanel";
import { WalletConnection } from "./WalletConnection";
import { WalletInfoPanel } from "./WalletInfoPanel";
import "../App.css";

type TabType =
	| "connection"
	// | "counter" // Contract操作系は一旦無効化
	| "addresses"
	| "sign-data"
	| "tx-history"
	| "wallet-info";

export function WalletApp() {
	const [activeTab, setActiveTab] = useState<TabType>("connection");
	const [walletApi, setWalletApi] = useState<Cip30WalletApi | null>(null);
	const [walletName, setWalletName] = useState<WalletName | null>(null);
	const [address, setAddress] = useState<string | null>(null);
	const [balance, setBalance] = useState<string | null>(null);
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		console.log("[WalletApp] State updated:", {
			walletApi: !!walletApi,
			walletName,
			address,
			balance,
		});
	}, [walletApi, walletName, address, balance]);

	const handleWalletDisconnected = () => {
		setWalletApi(null);
		setWalletName(null);
		setAddress(null);
		setBalance(null);
	};

	const handleRefresh = async () => {
		if (!walletApi || !address) {
			return;
		}

		setRefreshing(true);
		try {
			const bal = await getBalance(walletApi);
			setBalance(bal);
		} catch (err) {
			console.error("Failed to refresh balance:", err);
		} finally {
			setRefreshing(false);
		}
	};

	const tabs: Array<{ id: TabType; label: string; disabled?: boolean }> = [
		{ id: "connection", label: "Connection" },
		// Contract操作系は一旦無効化（WASM関連のビルドエラー回避のため）
		// { id: "counter", label: "Counter Contract", disabled: !walletApi },
		{ id: "addresses", label: "Addresses", disabled: !walletApi },
		{ id: "sign-data", label: "Sign Data", disabled: !walletApi },
		{ id: "tx-history", label: "Transaction History", disabled: !walletApi },
		{ id: "wallet-info", label: "Wallet Info", disabled: !walletApi },
	];

	return (
		<div className="app">
			<header className="header">
				<h1>Midnight Network Wallet Connection Tester</h1>
				{walletApi && walletName && (
					<div className="connection-info-header">
						<div className="info-item">
							<label>Wallet:</label>
							<span>{walletName}</span>
						</div>
						{address && address.trim() && (
							<div className="info-item">
								<label>Address:</label>
								<div className="address-display">
									<span className="address-short">
										{formatAddress(address)}
									</span>
									<button
										type="button"
										onClick={() => {
											navigator.clipboard.writeText(address);
										}}
										className="copy-button"
										title="Copy address"
									>
										Copy
									</button>
								</div>
							</div>
						)}
						<button
							type="button"
							onClick={handleRefresh}
							disabled={refreshing}
							className="refresh-button"
						>
							{refreshing ? "Refreshing..." : "Refresh"}
						</button>
					</div>
				)}
			</header>

			<main className="main">
				<div className="sidebar">
					<div className="tabs">
						{tabs.map((tab) => (
							<button
								key={tab.id}
								type="button"
								className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
								onClick={() => setActiveTab(tab.id)}
								disabled={tab.disabled}
								title={tab.disabled ? "Please connect a wallet" : undefined}
							>
								{tab.label}
							</button>
						))}
					</div>
				</div>

				<div className="content">
					{activeTab === "connection" && (
						<WalletConnection
							onConnected={() => {
								// WalletConnectionはDApp Connector APIを使用するため、
								// レガシーのhandleWalletConnectedは不要
							}}
							onDisconnected={handleWalletDisconnected}
						/>
					)}
					{/* Contract操作系は一旦無効化（WASM関連のビルドエラー回避のため） */}
					{/* {activeTab === "counter" && walletApi && (
						<CounterContractPanel
							walletApi={walletApi}
							walletName={walletName}
							address={address}
						/>
					)} */}
					{activeTab === "addresses" && walletApi && (
						<AddressesPanel walletApi={walletApi} />
					)}
					{activeTab === "sign-data" && walletApi && address && (
						<SignDataPanel walletApi={walletApi} address={address} />
					)}
					{activeTab === "tx-history" && address && (
						<TransactionHistoryPanel address={address} />
					)}
					{activeTab === "wallet-info" && walletApi && walletName && (
						<WalletInfoPanel walletApi={walletApi} walletName={walletName} />
					)}
				</div>
			</main>
		</div>
	);
}

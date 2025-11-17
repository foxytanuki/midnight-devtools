import { useState, useEffect } from "react";
import type { Cip30WalletApi, WalletName } from "../types/wallet-types";
import { getAvailableWallets } from "../utils/wallet-utils";
import "../App.css";

interface WalletInfoPanelProps {
	walletApi: Cip30WalletApi;
	walletName: WalletName;
}

export function WalletInfoPanel({
	walletApi,
	walletName,
}: WalletInfoPanelProps) {
	const [walletInfo, setWalletInfo] = useState<{
		name: string;
		apiVersion?: string;
		icon?: string;
	} | null>(null);

	useEffect(() => {
		const wallets = getAvailableWallets();
		const wallet = wallets.find((w) => w.name === walletName);
		if (wallet?.provider) {
			setWalletInfo({
				name: wallet.provider.name,
				apiVersion: wallet.provider.apiVersion,
				icon: wallet.provider.icon,
			});
		}
	}, [walletName]);

	return (
		<div className="method-panel">
			<h2>Wallet Information</h2>
			<p className="method-description-text">
				View detailed information about the connected wallet.
			</p>

			<div className="params-section">
				<h3>Wallet Details</h3>
				<div className="connection-info">
					<div className="info-item">
						<label>Wallet Name:</label>
						<span>{walletName}</span>
					</div>
					{walletInfo && (
						<>
							<div className="info-item">
								<label>Provider Name:</label>
								<span>{walletInfo.name}</span>
							</div>
							{walletInfo.apiVersion && (
								<div className="info-item">
									<label>API Version:</label>
									<span>{walletInfo.apiVersion}</span>
								</div>
							)}
							{walletInfo.icon && (
								<div className="info-item">
									<label>Icon:</label>
									<img
										src={walletInfo.icon}
										alt="Wallet icon"
										className="wallet-icon"
									/>
								</div>
							)}
						</>
					)}
				</div>
			</div>

			<div className="params-section">
				<h3>Available API Methods</h3>
				<div className="api-methods-list">
					<div className="api-method-item">
						<strong>getUsedAddresses()</strong>
						<span className="method-status">Available</span>
					</div>
					<div className="api-method-item">
						<strong>getUnusedAddresses()</strong>
						<span className="method-status">Available</span>
					</div>
					<div className="api-method-item">
						<strong>getChangeAddress()</strong>
						<span className="method-status">Available</span>
					</div>
					<div className="api-method-item">
						<strong>getBalance()</strong>
						<span className="method-status">Available</span>
					</div>
					<div className="api-method-item">
						<strong>signData()</strong>
						<span className="method-status">
							{walletApi.signData ? "Available" : "Not Available"}
						</span>
					</div>
				</div>
			</div>

			<div className="params-section">
				<h3>About CIP-30</h3>
				<p className="method-description-text">
					CIP-30 (Cardano Improvement Proposal 30) is a standard for DApp
					connector APIs that allows DApps to interact with wallets in a
					standardized way. Midnight Network wallets implement this standard
					to provide a consistent interface for DApp developers.
				</p>
			</div>
		</div>
	);
}


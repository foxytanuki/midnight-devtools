import { useState, useEffect } from "react";
import type { Cip30WalletApi } from "../types/wallet-types";
import { formatAddress } from "../utils/wallet-utils";
import "../App.css";

interface AddressesPanelProps {
	walletApi: Cip30WalletApi;
}

export function AddressesPanel({ walletApi }: AddressesPanelProps) {
	const [usedAddresses, setUsedAddresses] = useState<string[]>([]);
	const [unusedAddresses, setUnusedAddresses] = useState<string[]>([]);
	const [changeAddress, setChangeAddress] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>("");
	const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

	useEffect(() => {
		loadAddresses();
	}, [walletApi]);

	const loadAddresses = async () => {
		setLoading(true);
		setError("");

		try {
			const [used, unused, change] = await Promise.all([
				walletApi.getUsedAddresses().catch(() => []),
				walletApi.getUnusedAddresses().catch(() => []),
				walletApi.getChangeAddress().catch(() => null),
			]);

			setUsedAddresses(used || []);
			setUnusedAddresses(unused || []);
			setChangeAddress(change);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to load addresses",
			);
		} finally {
			setLoading(false);
		}
	};

	const copyToClipboard = (address: string) => {
		navigator.clipboard.writeText(address);
	};

	return (
		<div className="method-panel">
			<h2>Addresses</h2>
			<p className="method-description-text">
				View and manage all addresses associated with your wallet.
			</p>

			<div className="params-section">
				<div className="address-actions">
					<button
						type="button"
						onClick={loadAddresses}
						disabled={loading}
						className="refresh-button"
					>
						{loading ? "Loading..." : "Refresh Addresses"}
					</button>
				</div>
			</div>

			{changeAddress && (
				<div className="params-section">
					<h3>Change Address</h3>
					<div className="address-item">
						<div className="address-display">
							<span className="address-full">{changeAddress}</span>
							<span className="address-short">
								{formatAddress(changeAddress)}
							</span>
							<button
								type="button"
								onClick={() => copyToClipboard(changeAddress)}
								className="copy-button"
								title="Copy address"
							>
								Copy
							</button>
						</div>
					</div>
				</div>
			)}

			<div className="params-section">
				<h3>Used Addresses ({usedAddresses.length})</h3>
				{usedAddresses.length === 0 ? (
					<p className="no-addresses">No used addresses found</p>
				) : (
					<div className="address-list">
						{usedAddresses.map((address, index) => (
							<div
								key={index}
								className={`address-item ${
									selectedAddress === address ? "selected" : ""
								}`}
								onClick={() => setSelectedAddress(address)}
							>
								<div className="address-display">
									<span className="address-full">{address}</span>
									<span className="address-short">
										{formatAddress(address)}
									</span>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											copyToClipboard(address);
										}}
										className="copy-button"
										title="Copy address"
									>
										Copy
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			<div className="params-section">
				<h3>Unused Addresses ({unusedAddresses.length})</h3>
				{unusedAddresses.length === 0 ? (
					<p className="no-addresses">No unused addresses found</p>
				) : (
					<div className="address-list">
						{unusedAddresses.map((address, index) => (
							<div
								key={index}
								className={`address-item ${
									selectedAddress === address ? "selected" : ""
								}`}
								onClick={() => setSelectedAddress(address)}
							>
								<div className="address-display">
									<span className="address-full">{address}</span>
									<span className="address-short">
										{formatAddress(address)}
									</span>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											copyToClipboard(address);
										}}
										className="copy-button"
										title="Copy address"
									>
										Copy
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{error && (
				<div className="error-panel">
					<h3>Error</h3>
					<pre>{error}</pre>
				</div>
			)}
		</div>
	);
}


import { useCallback, useEffect, useState } from "react";
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

	const loadAddresses = useCallback(async () => {
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
			setError(err instanceof Error ? err.message : "Failed to load addresses");
		} finally {
			setLoading(false);
		}
	}, [walletApi]);

	useEffect(() => {
		loadAddresses();
	}, [loadAddresses]);

	const copyToClipboard = (address: string) => {
		navigator.clipboard.writeText(address);
	};

	const handleAddressClick = (address: string) => {
		setSelectedAddress(address);
	};

	return (
		<div className="method-panel">
			<h2>Addresses</h2>
			<p className="method-description-text">
				View and manage all addresses associated with your wallet.
			</p>
			<div className="info-box" style={{ marginTop: "1rem" }}>
				<strong>Note about address display:</strong>
				<br />
				<br />
				The Midnight Lace Wallet API does not provide separate methods for used
				and unused addresses like traditional CIP-30 wallets. The DApp Connector
				API only exposes a single address through the <code>state()</code>{" "}
				method.
				<br />
				<br />
				To maintain compatibility with CIP-30 interfaces, the adapter returns
				the same address for both <code>getUsedAddresses()</code> and{" "}
				<code>getUnusedAddresses()</code>. This is why the same address appears
				in both sections - it reflects a limitation of the current API
				implementation, not a fundamental characteristic of Midnight Network's
				shielded address system.
			</div>
			<br />

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
						{usedAddresses.map((address) => (
							<button
								key={address}
								type="button"
								className={`address-item ${
									selectedAddress === address ? "selected" : ""
								}`}
								onClick={() => handleAddressClick(address)}
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
							</button>
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
						{unusedAddresses.map((address) => (
							<button
								key={address}
								type="button"
								className={`address-item ${
									selectedAddress === address ? "selected" : ""
								}`}
								onClick={() => handleAddressClick(address)}
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
							</button>
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

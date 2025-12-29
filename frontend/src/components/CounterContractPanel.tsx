import { useEffect, useState } from "react";
import { useNetwork } from "../contexts/NetworkContext";
import { useWallet } from "../hooks/useWallet";
import { checkProofServer, getCounterValue } from "../utils/counter-contract";
import "../App.css";

export function CounterContractPanel() {
	const { currentNetwork } = useNetwork();
	const { connectedAPI } = useWallet();
	// Default contract address for testing (deployed via CLI)
	const [contractAddress, setContractAddress] = useState<string>(
		"0200ea62067fe8bac97e8f8caaee6413c8ed7f42e0a960335f1b1aeb43fa37999315",
	);
	const [joining, setJoining] = useState(false);
	const [incrementing, setIncrementing] = useState(false);
	const [viewingState, setViewingState] = useState(false);
	const [counterValue, setCounterValue] = useState<bigint | null>(null);
	const [error, setError] = useState<string>("");
	const [proofServerStatus, setProofServerStatus] = useState<boolean | null>(
		null,
	);
	const [checkingProofServer, setCheckingProofServer] = useState(false);

	useEffect(() => {
		checkProofServerStatus();
	}, []);

	const checkProofServerStatus = async () => {
		setCheckingProofServer(true);
		try {
			const available = await checkProofServer();
			setProofServerStatus(available);
		} catch {
			setProofServerStatus(false);
		} finally {
			setCheckingProofServer(false);
		}
	};

	// ウォレットが接続されていない場合はエラーを表示
	if (!connectedAPI) {
		return (
			<div className="method-panel">
				<h2>Counter Contract</h2>
				<div className="error-panel">
					<h3>Wallet Not Connected</h3>
					<p>
						Please connect your wallet first to interact with Counter contracts.
					</p>
				</div>
			</div>
		);
	}

	const handleJoin = async () => {
		if (!contractAddress.trim()) {
			setError("Please enter a contract address");
			return;
		}

		if (!connectedAPI) {
			setError("Wallet not connected");
			return;
		}

		setJoining(true);
		setError("");

		try {
			// Note: Counter contract functionality requires migration from CIP-30 API to DApp Connector API.
			// The current counter-contract.ts utilities expect CIP-30 API, but we're using DApp Connector API.
			// This feature is not yet implemented. See counter-contract.ts for the legacy implementation.
			setError(
				"Counter contract join is not yet implemented with DApp Connector API. " +
					"The legacy CIP-30 implementation exists in counter-contract.ts but requires migration.",
			);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to join contract");
		} finally {
			setJoining(false);
		}
	};

	const handleIncrement = async () => {
		if (!contractAddress.trim()) {
			setError("Please join a contract first");
			return;
		}

		if (!connectedAPI) {
			setError("Wallet not connected");
			return;
		}

		setIncrementing(true);
		setError("");

		try {
			// Note: Counter contract functionality requires migration from CIP-30 API to DApp Connector API.
			// The current counter-contract.ts utilities expect CIP-30 API, but we're using DApp Connector API.
			// This feature is not yet implemented. See counter-contract.ts for the legacy implementation.
			setError(
				"Counter contract increment is not yet implemented with DApp Connector API. " +
					"The legacy CIP-30 implementation exists in counter-contract.ts but requires migration.",
			);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to increment counter",
			);
		} finally {
			setIncrementing(false);
		}
	};

	const handleViewState = async () => {
		if (!contractAddress.trim()) {
			setError("Please enter a contract address");
			return;
		}

		setViewingState(true);
		setError("");
		setCounterValue(null);

		try {
			const value = await getCounterValue(
				contractAddress.trim(),
				currentNetwork,
			);
			setCounterValue(value);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to view contract state",
			);
		} finally {
			setViewingState(false);
		}
	};

	return (
		<div className="method-panel">
			<h2>Counter Contract</h2>
			<p className="method-description-text">
				Join and interact with existing Counter contracts on Midnight Network.
				This contract maintains a public counter that can be incremented.
			</p>
			<div
				className="info-box"
				style={{ marginTop: "1rem", marginBottom: "1rem" }}
			>
				<strong>Note:</strong> Contract deployment is not yet available in the
				browser environment. Please use a deployed contract address to interact
				with existing contracts.
			</div>

			<div className="params-section">
				<h3>Proof Server Status</h3>
				<div className="info-item">
					<label>Status:</label>
					<span>
						{checkingProofServer ? (
							"Checking..."
						) : proofServerStatus === null ? (
							"Unknown"
						) : proofServerStatus ? (
							<span style={{ color: "var(--color-success)" }}>Running</span>
						) : (
							<span style={{ color: "var(--color-error)" }}>Not Running</span>
						)}
					</span>
					<button
						type="button"
						onClick={checkProofServerStatus}
						disabled={checkingProofServer}
						className="refresh-button"
						style={{ marginTop: "0.5rem" }}
					>
						{checkingProofServer ? "Checking..." : "Refresh"}
					</button>
				</div>
				{proofServerStatus === false && (
					<div className="info-box" style={{ marginTop: "0.75rem" }}>
						<strong>Proof Server is not running.</strong>
						<br />
						Start it with:
						<br />
						<code>
							docker run -p 6300:6300 midnightnetwork/proof-server:latest
						</code>
					</div>
				)}
			</div>

			<div className="params-section">
				<h3>Contract Address</h3>
				<div className="param-input">
					<label>
						Contract Address
						<input
							type="text"
							value={contractAddress}
							onChange={(e) => setContractAddress(e.target.value)}
							placeholder="Enter deployed contract address..."
							className="contract-address-input"
						/>
					</label>
				</div>
			</div>

			<div className="params-section">
				<h3>Actions</h3>
				<div className="contract-actions">
					<button
						type="button"
						onClick={handleJoin}
						disabled={joining || !contractAddress.trim()}
						className="call-button"
						style={{ backgroundColor: "var(--color-primary)" }}
					>
						{joining ? "Joining..." : "Join Contract"}
					</button>
					<button
						type="button"
						onClick={handleViewState}
						disabled={viewingState || !contractAddress.trim()}
						className="call-button"
					>
						{viewingState ? "Loading..." : "View Counter Value"}
					</button>
					<button
						type="button"
						onClick={handleIncrement}
						disabled={incrementing || !contractAddress.trim()}
						className="call-button"
					>
						{incrementing ? "Incrementing..." : "Increment Counter"}
					</button>
				</div>
			</div>

			{counterValue !== null && (
				<div className="result-panel">
					<h3>Counter Value</h3>
					<div className="counter-value-display">
						<strong>{counterValue.toString()}</strong>
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
						<strong>Enter Contract Address:</strong> Input the address of an
						existing deployed Counter contract
					</li>
					<li>
						<strong>Join:</strong> Connect to the Counter contract by clicking
						"Join Contract"
					</li>
					<li>
						<strong>View State:</strong> Query the current counter value from
						the blockchain
					</li>
					<li>
						<strong>Increment:</strong> Call the increment() function to
						increase the counter by 1
					</li>
				</ol>
				<div className="info-box">
					<strong>Note:</strong> This feature requires:
					<ul>
						<li>Proof Server running on http://localhost:6300</li>
						<li>Midnight.js browser integration</li>
						<li>A deployed Counter contract address</li>
					</ul>
					<br />
					<strong>Contract Deployment:</strong> Contract deployment is currently
					only available in Node.js environments. Browser-based deployment will
					be supported in a future update.
				</div>
			</div>
		</div>
	);
}

import { useState } from "react";
import type { Cip30WalletApi } from "../types/wallet-types";
import "../App.css";

interface SignDataPanelProps {
	walletApi: Cip30WalletApi;
	address: string;
}

export function SignDataPanel({ walletApi, address }: SignDataPanelProps) {
	const [payload, setPayload] = useState<string>("");
	const [signing, setSigning] = useState(false);
	const [signature, setSignature] = useState<string | null>(null);
	const [error, setError] = useState<string>("");

	const handleSign = async () => {
		if (!payload.trim()) {
			setError("Please enter a payload to sign");
			return;
		}

		if (!walletApi.signData) {
			setError("This wallet does not support signData");
			return;
		}

		setSigning(true);
		setError("");
		setSignature(null);

		try {
			// Convert payload to hex if needed
			let hexPayload = payload;
			if (!payload.startsWith("0x")) {
				// Try to convert string to hex
				hexPayload =
					"0x" +
					Array.from(payload)
						.map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
						.join("");
			}

			const result = await walletApi.signData(address, hexPayload);
			setSignature(result.signature);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to sign data",
			);
		} finally {
			setSigning(false);
		}
	};

	const handleClear = () => {
		setPayload("");
		setSignature(null);
		setError("");
	};

	return (
		<div className="method-panel">
			<h2>Sign Data</h2>
			<p className="method-description-text">
				Sign arbitrary data using your wallet. The payload should be in HEX
				format (starting with 0x) or plain text (will be converted to hex).
			</p>

			<div className="params-section">
				<h3>Signing Address</h3>
				<div className="info-item">
					<label>Address:</label>
					<span className="address-short">{address}</span>
				</div>
			</div>

			<div className="params-section">
				<h3>Payload</h3>
				<div className="param-input">
					<label>
						Data to Sign (HEX format or plain text)
						<textarea
							value={payload}
							onChange={(e) => setPayload(e.target.value)}
							placeholder="0x1234... or plain text"
							rows={4}
							className="payload-input"
						/>
					</label>
				</div>
			</div>

			<div className="params-section">
				<div className="sign-actions">
					<button
						type="button"
						onClick={handleSign}
						disabled={signing || !payload.trim()}
						className="call-button"
					>
						{signing ? "Signing..." : "Sign Data"}
					</button>
					<button
						type="button"
						onClick={handleClear}
						className="disconnect-button"
					>
						Clear
					</button>
				</div>
			</div>

			{signature && (
				<div className="result-panel">
					<h3>Signature</h3>
					<div className="signature-display">
						<pre>{signature}</pre>
						<button
							type="button"
							onClick={() => {
								navigator.clipboard.writeText(signature);
							}}
							className="copy-button"
							title="Copy signature"
						>
							Copy
						</button>
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
					<li>Enter the data you want to sign (HEX format or plain text)</li>
					<li>Click "Sign Data" to request signature from your wallet</li>
					<li>The signature will be displayed and can be copied</li>
				</ol>
				<div className="info-box">
					<strong>Note:</strong> Not all wallets support the signData API. If
					your wallet doesn't support it, this feature will not be available.
				</div>
			</div>
		</div>
	);
}


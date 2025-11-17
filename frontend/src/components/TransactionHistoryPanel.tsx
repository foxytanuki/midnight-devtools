import { useState } from "react";
import { RpcClient } from "../clients/rpc-client";
import { searchTransactionsByAccount } from "../utils/tx-search";
import { getBlockExplorerUrl } from "../utils/explorer-utils";
import type { TransactionSearchResult } from "../utils/tx-search";
import "../App.css";

const DEFAULT_RPC_ENDPOINT = "https://rpc.testnet-02.midnight.network/";

interface TransactionHistoryPanelProps {
	address: string;
}

export function TransactionHistoryPanel({
	address,
}: TransactionHistoryPanelProps) {
	const [rpcEndpoint, setRpcEndpoint] = useState(DEFAULT_RPC_ENDPOINT);
	const [searching, setSearching] = useState(false);
	const [transactions, setTransactions] = useState<TransactionSearchResult[]>(
		[],
	);
	const [error, setError] = useState<string>("");
	const [maxBlocks, setMaxBlocks] = useState<string>("100");

	const handleSearch = async () => {
		setSearching(true);
		setError("");
		setTransactions([]);

		try {
			const client = new RpcClient({ endpoint: rpcEndpoint, timeout: 30000 });
			const results = await searchTransactionsByAccount(client, address, {
				maxBlocks: maxBlocks ? parseInt(maxBlocks, 10) : undefined,
			});

			setTransactions(results);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to search transactions",
			);
		} finally {
			setSearching(false);
		}
	};

	return (
		<div className="method-panel">
			<h2>Transaction History</h2>
			<p className="method-description-text">
				Search for transactions related to the connected address using RPC.
			</p>

			<div className="params-section">
				<h3>Search Configuration</h3>
				<div className="param-input">
					<label>
						RPC Endpoint
						<input
							type="text"
							value={rpcEndpoint}
							onChange={(e) => setRpcEndpoint(e.target.value)}
							className="endpoint-input"
						/>
					</label>
				</div>
				<div className="param-input">
					<label>
						Max Blocks to Search (Default: 100)
						<input
							type="number"
							value={maxBlocks}
							onChange={(e) => setMaxBlocks(e.target.value)}
							placeholder="100"
						/>
					</label>
				</div>
				<div className="param-input">
					<label>
						Address
						<input
							type="text"
							value={address}
							readOnly
							className="address-input-readonly"
						/>
					</label>
				</div>
			</div>

			<div className="params-section">
				<button
					type="button"
					onClick={handleSearch}
					disabled={searching}
					className="call-button"
				>
					{searching ? "Searching..." : "Search Transactions"}
				</button>
			</div>

			{transactions.length > 0 && (
				<div className="result-panel">
					<h3>Search Results ({transactions.length} found)</h3>
					<div className="search-results-list">
						{transactions.map((tx, index) => (
							<div key={index} className="search-result-item">
								<div className="result-item-header">
									<span>
										Block #{tx.blockNumber} (Index: {tx.extrinsicIndex})
									</span>
									<a
										href={getBlockExplorerUrl(tx.blockHash)}
										target="_blank"
										rel="noopener noreferrer"
										className="explorer-link-small"
									>
										Explorer
									</a>
								</div>
								<pre className="result-item-content">
									{JSON.stringify(tx, null, 2)}
								</pre>
							</div>
						))}
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
					<li>Configure the RPC endpoint (default: testnet)</li>
					<li>Set the maximum number of blocks to search</li>
					<li>Click "Search Transactions" to find transactions</li>
					<li>Click "Explorer" links to view transactions on the block explorer</li>
				</ol>
				<div className="info-box">
					<strong>Note:</strong> Transaction search may take some time depending
					on the number of blocks to search. For more efficient searching,
					consider using the Indexer GraphQL API.
				</div>
			</div>
		</div>
	);
}


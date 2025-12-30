import { useCallback, useEffect, useRef, useState } from "react";
import { GraphQLClient } from "../clients/graphql-client";
import { useNetwork } from "../contexts/NetworkContext";
import { useWallet } from "../hooks/useWallet";
import type {
	RelevantTransaction,
	ShieldedTransactionsEvent,
	ShieldedTransactionsProgress,
	UnshieldedTransaction,
	UnshieldedTransactionsEvent,
	UnshieldedTransactionsProgress,
} from "../types/wallet-types";
import { getBlockExplorerUrl } from "../utils/explorer-utils";
import { getViewingKey, ViewingKeyError } from "../utils/wallet-indexer";
import "../App.css";

const CONNECT_MUTATION = `
  mutation Connect($viewingKey: ViewingKey!) {
    connect(viewingKey: $viewingKey)
  }
`;

const DISCONNECT_MUTATION = `
  mutation Disconnect($sessionId: HexEncoded!) {
    disconnect(sessionId: $sessionId)
  }
`;

const SHIELDED_TRANSACTIONS_SUBSCRIPTION = `
  subscription ShieldedTransactions($sessionId: HexEncoded!, $index: Int) {
    shieldedTransactions(sessionId: $sessionId, index: $index) {
      __typename
      ... on RelevantTransaction {
        transaction {
          id
          hash
          protocolVersion
          block {
            height
            hash
            timestamp
          }
          fees {
            paidFees
            estimatedFees
          }
          transactionResult {
            status
            segments {
              id
              success
            }
          }
          identifiers
          startIndex
          endIndex
        }
        collapsedMerkleTree {
          startIndex
          endIndex
          update
          protocolVersion
        }
      }
      ... on ShieldedTransactionsProgress {
        highestEndIndex
        highestCheckedEndIndex
        highestRelevantEndIndex
      }
    }
  }
`;

const UNSHIELDED_TRANSACTIONS_SUBSCRIPTION = `
  subscription UnshieldedTransactions($address: UnshieldedAddress!, $transactionId: Int) {
    unshieldedTransactions(address: $address, transactionId: $transactionId) {
      __typename
      ... on UnshieldedTransaction {
        transaction {
          id
          hash
          block {
            height
            hash
            timestamp
          }
        }
        createdUtxos {
          owner
          value
          tokenType
          intentHash
          outputIndex
          ctime
          initialNonce
          registeredForDustGeneration
        }
        spentUtxos {
          owner
          value
          tokenType
          intentHash
          outputIndex
          ctime
          initialNonce
          registeredForDustGeneration
        }
      }
      ... on UnshieldedTransactionsProgress {
        highestTransactionId
      }
    }
  }
`;

export function WalletIndexedData() {
	const { connectedAPI, serviceUriConfig, unshieldedAddress, status } =
		useWallet();
	const { currentNetwork } = useNetwork();

	const [sessionId, setSessionId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [shieldedTransactions, setShieldedTransactions] = useState<
		RelevantTransaction[]
	>([]);
	const [shieldedProgress, setShieldedProgress] =
		useState<ShieldedTransactionsProgress | null>(null);
	const [unshieldedTransactions, setUnshieldedTransactions] = useState<
		UnshieldedTransaction[]
	>([]);
	const [unshieldedProgress, setUnshieldedProgress] =
		useState<UnshieldedTransactionsProgress | null>(null);

	const graphqlClientRef = useRef<GraphQLClient | null>(null);
	const shieldedSubscriptionRef = useRef<(() => void) | null>(null);
	const unshieldedSubscriptionRef = useRef<(() => void) | null>(null);

	// GraphQLクライアントの初期化
	useEffect(() => {
		if (!serviceUriConfig?.indexerUri) {
			return;
		}

		graphqlClientRef.current = new GraphQLClient({
			endpoint: serviceUriConfig.indexerUri,
			wsEndpoint: serviceUriConfig.indexerWsUri,
			timeout: 30000,
		});

		return () => {
			// クリーンアップ
			if (shieldedSubscriptionRef.current) {
				shieldedSubscriptionRef.current();
				shieldedSubscriptionRef.current = null;
			}
			if (unshieldedSubscriptionRef.current) {
				unshieldedSubscriptionRef.current();
				unshieldedSubscriptionRef.current = null;
			}
			if (graphqlClientRef.current) {
				graphqlClientRef.current.dispose();
				graphqlClientRef.current = null;
			}
		};
	}, [serviceUriConfig]);

	// セッション接続（Viewing Keyが利用可能な場合のみ）
	useEffect(() => {
		if (!connectedAPI || !graphqlClientRef.current) {
			return;
		}

		let mounted = true;

		const connect = async () => {
			try {
				// viewing keyを取得
				const viewingKey = await getViewingKey(connectedAPI);

				// connect mutationを実行
				if (!graphqlClientRef.current) {
					throw new Error("GraphQL client not initialized");
				}
				const result = await graphqlClientRef.current.mutate<{
					connect: string;
				}>(CONNECT_MUTATION, {
					viewingKey,
				});

				const newSessionId = result.connect;
				if (!mounted) return;
				setSessionId(newSessionId);

				// Shielded transactions subscriptionを開始
				if (graphqlClientRef.current) {
					shieldedSubscriptionRef.current = graphqlClientRef.current.subscribe({
						query: SHIELDED_TRANSACTIONS_SUBSCRIPTION,
						variables: {
							sessionId: newSessionId,
							index: 0,
						},
						onNext: (data: unknown) => {
							const event = (
								data as { shieldedTransactions: ShieldedTransactionsEvent }
							).shieldedTransactions;

							// Type guard for RelevantTransaction
							if ("transaction" in event) {
								setShieldedTransactions((prev) => [
									...prev,
									event as RelevantTransaction,
								]);
							} else if ("highestEndIndex" in event) {
								setShieldedProgress(event as ShieldedTransactionsProgress);
							}
						},
						onError: (err) => {
							console.error("Shielded transactions subscription error:", err);
							if (mounted) {
								setError(`Subscription error: ${err.message}`);
							}
						},
					});
				}
			} catch (err) {
				// Viewing Keyエラーは無視（Shielded Transactionsは表示しない）
				if (err instanceof ViewingKeyError) {
					// Viewing Keyが利用できない場合は、エラーを表示せずに終了
					console.log(
						"Viewing key not available, skipping shielded transactions",
					);
				} else if (mounted) {
					setError(
						err instanceof Error ? err.message : "Failed to connect to indexer",
					);
				}
			}
		};

		connect();

		return () => {
			mounted = false;
		};
	}, [connectedAPI]);

	// セッション切断
	const handleDisconnect = useCallback(async () => {
		if (!sessionId || !graphqlClientRef.current) {
			return;
		}

		try {
			// subscriptionsを停止
			if (shieldedSubscriptionRef.current) {
				shieldedSubscriptionRef.current();
				shieldedSubscriptionRef.current = null;
			}
			if (unshieldedSubscriptionRef.current) {
				unshieldedSubscriptionRef.current();
				unshieldedSubscriptionRef.current = null;
			}

			// disconnect mutationを実行
			await graphqlClientRef.current.mutate(DISCONNECT_MUTATION, {
				sessionId,
			});

			setSessionId(null);
			setShieldedTransactions([]);
			setShieldedProgress(null);
			setUnshieldedTransactions([]);
			setUnshieldedProgress(null);
		} catch (err) {
			console.error("Failed to disconnect:", err);
			setError(
				err instanceof Error
					? err.message
					: "Failed to disconnect from indexer",
			);
		}
	}, [sessionId]);

	// Unshielded transactions subscriptionを開始
	// viewing keyは不要なので、unshieldedAddressがあればすぐに開始できる
	useEffect(() => {
		if (!unshieldedAddress || !graphqlClientRef.current) {
			return;
		}

		// 既存のsubscriptionがあれば停止
		if (unshieldedSubscriptionRef.current) {
			unshieldedSubscriptionRef.current();
			unshieldedSubscriptionRef.current = null;
		}

		unshieldedSubscriptionRef.current = graphqlClientRef.current.subscribe({
			query: UNSHIELDED_TRANSACTIONS_SUBSCRIPTION,
			variables: {
				address: unshieldedAddress.unshieldedAddress,
				transactionId: 0,
			},
			onNext: (data: unknown) => {
				const event = (
					data as { unshieldedTransactions: UnshieldedTransactionsEvent }
				).unshieldedTransactions;

				// Type guard for UnshieldedTransaction
				if ("transaction" in event) {
					setUnshieldedTransactions((prev) => [
						...prev,
						event as UnshieldedTransaction,
					]);
				} else if ("highestTransactionId" in event) {
					setUnshieldedProgress(event as UnshieldedTransactionsProgress);
				}
			},
			onError: (err) => {
				console.error("Unshielded transactions subscription error:", err);
				setError(`Subscription error: ${err.message}`);
			},
		});

		return () => {
			if (unshieldedSubscriptionRef.current) {
				unshieldedSubscriptionRef.current();
				unshieldedSubscriptionRef.current = null;
			}
		};
	}, [unshieldedAddress]);

	const isConnected = status?.status === "connected";
	const hasIndexerConfig =
		serviceUriConfig?.indexerUri && serviceUriConfig?.indexerWsUri;

	return (
		<div className="method-panel" style={{ paddingBottom: 0 }}>
			<h2>Wallet Indexed Data</h2>
			<p className="method-description-text">
				View transaction history and balance information indexed by the Midnight
				Indexer. Connect your wallet session to start receiving real-time
				updates.
			</p>

			{!isConnected && (
				<div className="info-box">
					<strong>Wallet not connected.</strong>
					<br />
					Please connect your wallet first using the Connection tab.
				</div>
			)}

			{isConnected && !hasIndexerConfig && (
				<div className="info-box">
					<strong>Indexer configuration not available.</strong>
					<br />
					The wallet connection does not provide indexer API endpoints.
				</div>
			)}

			{isConnected && hasIndexerConfig && (
				<>
					{sessionId && (
						<div className="params-section">
							<h3>Session Management</h3>
							<div className="connection-info">
								<div className="info-item">
									<span>Session ID</span>
									<div className="address-display">
										<span className="address-full">{sessionId}</span>
										<button
											type="button"
											onClick={() => {
												navigator.clipboard.writeText(sessionId);
											}}
											className="copy-button"
											title="Copy session ID"
										>
											Copy
										</button>
									</div>
								</div>
								<div className="connection-actions">
									<button
										type="button"
										onClick={handleDisconnect}
										className="disconnect-button"
									>
										Disconnect Session
									</button>
								</div>
							</div>
						</div>
					)}

					{error && (
						<div className="error-panel">
							<h3>Error</h3>
							<pre>{error}</pre>
						</div>
					)}

					{unshieldedAddress && (
						<div
							className="params-section"
							style={{ marginBottom: 0, paddingBottom: 0 }}
						>
							<div className="result-header">
								<h3>Unshielded Transactions</h3>
								{unshieldedTransactions.length > 0 && (
									<span className="transaction-count">
										{unshieldedTransactions.length} transaction
										{unshieldedTransactions.length !== 1 ? "s" : ""}
									</span>
								)}
							</div>
							<p className="method-description-text">
								Unshielded transactions are available without viewing key. They
								are indexed by address and updated in real-time. NIGHT (the
								native token, tNIGHT on preview/testnet networks) is used in
								unshielded transactions.
							</p>
							{unshieldedProgress && (
								<div className="info-box" style={{ marginBottom: "1rem" }}>
									<strong>Indexing Progress:</strong>
									<br />
									Highest Transaction ID:{" "}
									{unshieldedProgress.highestTransactionId}
								</div>
							)}
							{unshieldedTransactions.length === 0 ? (
								<div className="no-results">
									<p>No unshielded transactions found yet.</p>
									<p style={{ fontSize: "0.8125rem", marginTop: "0.5rem" }}>
										Transactions will appear here as they are indexed.
									</p>
								</div>
							) : (
								<div
									className="search-results-list"
									style={{
										maxHeight: "none",
										overflowY: "visible",
										flex: 1,
									}}
								>
									{[...unshieldedTransactions]
										.sort((a, b) => {
											// ブロック番号（height）で降順ソート（新しい順）
											return (
												b.transaction.block.height - a.transaction.block.height
											);
										})
										.map((item, index) => {
											const formatTimestamp = (timestamp?: number) => {
												if (!timestamp) return null;
												// Midnight Networkのタイムスタンプは秒単位のUnixタイムスタンプ
												// ただし、値が異常に大きい場合は既にミリ秒単位の可能性がある
												// 一般的なUnixタイムスタンプ（秒）は10桁、ミリ秒は13桁
												const timestampMs =
													timestamp > 1e12 ? timestamp : timestamp * 1000;
												const date = new Date(timestampMs);
												// 無効な日付の場合は元の値を表示
												if (Number.isNaN(date.getTime())) {
													return `Invalid timestamp: ${timestamp}`;
												}
												return date.toLocaleString();
											};

											const formatValue = (value: string) => {
												const numValue = BigInt(value);
												// Convert from atomic units (SPECK) to NIGHT/tNIGHT (1 NIGHT = 10^9 SPECK)
												const nightValue = Number(numValue) / 1e9;
												return nightValue.toLocaleString(undefined, {
													minimumFractionDigits: 0,
													maximumFractionDigits: 9,
												});
											};

											const isNativeToken = (tokenType: string): boolean => {
												// Native token (NIGHT/tNIGHT) type is all zeros (32 bytes = 64 hex chars)
												return /^0+$/.test(tokenType.replace(/^0x/, ""));
											};

											const getNativeTokenName = (): string => {
												// Preview/testnet networks use tNIGHT, mainnet uses NIGHT
												const networkId = currentNetwork.id;
												if (
													networkId === "midnight-preview" ||
													networkId === "testnet-02" ||
													networkId === "0.18-undeployed1-kitsunesh"
												) {
													return "tNIGHT";
												}
												return "NIGHT";
											};

											const formatTokenType = (tokenType: string): string => {
												if (isNativeToken(tokenType)) {
													return `${getNativeTokenName()} (Native Token)`;
												}
												return `${tokenType.slice(0, 16)}...`;
											};

											const totalCreated = item.createdUtxos.reduce(
												(sum, utxo) => sum + BigInt(utxo.value),
												BigInt(0),
											);
											const totalSpent = item.spentUtxos.reduce(
												(sum, utxo) => sum + BigInt(utxo.value),
												BigInt(0),
											);
											const netAmount = totalCreated - totalSpent;

											// Determine transaction type
											const getTransactionType = (): {
												type: string;
												description: string;
											} => {
												if (
													item.spentUtxos.length === 0 &&
													item.createdUtxos.length > 0
												) {
													return {
														type: "Receive",
														description: "Received funds",
													};
												}
												if (
													item.spentUtxos.length > 0 &&
													item.createdUtxos.length === 0
												) {
													return {
														type: "Send",
														description: "Sent funds",
													};
												}

												// Check if all spent and created UTXOs have the same owner
												const spentOwners = new Set(
													item.spentUtxos.map(
														(utxo) => utxo.owner?.toLowerCase() || "",
													),
												);
												const createdOwners = new Set(
													item.createdUtxos.map(
														(utxo) => utxo.owner?.toLowerCase() || "",
													),
												);

												// If all owners are the same and net amount is zero, it's a UTXO consolidation
												if (
													spentOwners.size === 1 &&
													createdOwners.size === 1 &&
													spentOwners.has(Array.from(createdOwners)[0]) &&
													netAmount === BigInt(0)
												) {
													return {
														type: "UTXO Consolidation",
														description:
															"UTXO consolidation (same address, zero net change)",
													};
												}

												// If all owners are the same but net amount is not zero
												if (
													spentOwners.size === 1 &&
													createdOwners.size === 1 &&
													spentOwners.has(Array.from(createdOwners)[0])
												) {
													return {
														type: "Self Transfer",
														description: "Self transfer (same address)",
													};
												}

												return {
													type: "Transfer",
													description: "Transfer between addresses",
												};
											};

											const txType = getTransactionType();

											return (
												<div
													key={`unshielded-${item.transaction.id}-${item.transaction.block.height}-${index}`}
													className="unshielded-transaction-card"
												>
													<div className="result-item-header">
														<div
															style={{
																display: "flex",
																alignItems: "center",
																gap: "0.75rem",
																flexWrap: "wrap",
															}}
														>
															<span>
																Tx #{item.transaction.id} • Block #
																{item.transaction.block.height}
															</span>
															{item.transaction.block.timestamp && (
																<span
																	style={{
																		fontSize: "0.8125rem",
																		color: "var(--color-text-secondary)",
																		fontWeight: "normal",
																	}}
																>
																	{formatTimestamp(
																		item.transaction.block.timestamp,
																	)}
																</span>
															)}
														</div>
														<div
															style={{
																display: "flex",
																alignItems: "center",
																gap: "0.5rem",
															}}
														>
															{item.transaction.block.height && (
																<a
																	href={getBlockExplorerUrl(
																		item.transaction.block.height,
																	)}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="explorer-link-small"
																	title="View block in explorer"
																>
																	View Block
																</a>
															)}
															<button
																type="button"
																onClick={() => {
																	navigator.clipboard.writeText(
																		item.transaction.hash,
																	);
																}}
																className="copy-button"
																title="Copy transaction hash"
																style={{
																	fontSize: "0.8125rem",
																	padding: "0.25rem 0.5rem",
																}}
															>
																Copy Hash
															</button>
														</div>
													</div>
													<div className="transaction-hash-display">
														<code>{item.transaction.hash}</code>
													</div>
													<div
														style={{
															marginTop: "0.75rem",
															padding: "0.625rem",
															background:
																txType.type === "UTXO Consolidation"
																	? "var(--color-surface)"
																	: txType.type === "Self Transfer"
																		? "var(--color-surface)"
																		: "var(--color-bg)",
															border: "1px solid var(--color-border)",
															borderRadius: "2px",
															fontSize: "0.8125rem",
														}}
													>
														<strong>Type:</strong> {txType.type}
														{txType.description && (
															<span
																style={{
																	color: "var(--color-text-secondary)",
																	marginLeft: "0.5rem",
																}}
															>
																({txType.description})
															</span>
														)}
													</div>
													<div className="utxo-summary">
														{item.createdUtxos.length > 0 && (
															<div className="utxo-section utxo-received">
																<div className="utxo-section-header">
																	<span className="utxo-label">Received</span>
																	<span className="utxo-count">
																		{item.createdUtxos.length} UTXO
																		{item.createdUtxos.length !== 1 ? "s" : ""}
																	</span>
																</div>
																<div className="utxo-total">
																	+{formatValue(totalCreated.toString())}{" "}
																	{getNativeTokenName()}
																</div>
																<div className="utxo-list">
																	{item.createdUtxos.map((utxo, utxoIndex) => (
																		<div key={`created-utxo-${utxoIndex}-${utxo.value}-${utxo.tokenType}`} className="utxo-item">
																			<div className="utxo-value">
																				+{formatValue(utxo.value)}{" "}
																				{isNativeToken(utxo.tokenType)
																					? getNativeTokenName()
																					: "tokens"}
																			</div>
																			<div className="utxo-token">
																				Token: {formatTokenType(utxo.tokenType)}
																			</div>
																			{utxo.owner && (
																				<div className="utxo-owner">
																					Owner: {utxo.owner}
																					<button
																						type="button"
																						onClick={() => {
																							navigator.clipboard.writeText(
																								utxo.owner,
																							);
																						}}
																						className="copy-button"
																						title="Copy owner address"
																						style={{
																							fontSize: "0.75rem",
																							padding: "0.125rem 0.25rem",
																							marginLeft: "0.5rem",
																						}}
																					>
																						Copy
																					</button>
																				</div>
																			)}
																			{utxo.intentHash && (
																				<div
																					style={{
																						color: "var(--color-text-muted)",
																						fontSize: "0.75rem",
																						fontFamily: "monospace",
																						marginTop: "0.25rem",
																					}}
																				>
																					Intent: {utxo.intentHash.slice(0, 16)}
																					...
																				</div>
																			)}
																		</div>
																	))}
																</div>
															</div>
														)}
														{item.spentUtxos.length > 0 && (
															<div className="utxo-section utxo-sent">
																<div className="utxo-section-header">
																	<span className="utxo-label">Sent</span>
																	<span className="utxo-count">
																		{item.spentUtxos.length} UTXO
																		{item.spentUtxos.length !== 1 ? "s" : ""}
																	</span>
																</div>
																<div className="utxo-total">
																	-{formatValue(totalSpent.toString())}{" "}
																	{getNativeTokenName()}
																</div>
																<div className="utxo-list">
																	{item.spentUtxos.map((utxo, utxoIndex) => (
																		<div key={`spent-utxo-${utxoIndex}-${utxo.value}-${utxo.tokenType}`} className="utxo-item">
																			<div className="utxo-value">
																				-{formatValue(utxo.value)}{" "}
																				{isNativeToken(utxo.tokenType)
																					? getNativeTokenName()
																					: "tokens"}
																			</div>
																			<div className="utxo-token">
																				Token: {formatTokenType(utxo.tokenType)}
																			</div>
																			{utxo.owner && (
																				<div className="utxo-owner">
																					Owner: {utxo.owner}
																					<button
																						type="button"
																						onClick={() => {
																							navigator.clipboard.writeText(
																								utxo.owner,
																							);
																						}}
																						className="copy-button"
																						title="Copy owner address"
																						style={{
																							fontSize: "0.75rem",
																							padding: "0.125rem 0.25rem",
																							marginLeft: "0.5rem",
																						}}
																					>
																						Copy
																					</button>
																				</div>
																			)}
																			{utxo.intentHash && (
																				<div
																					style={{
																						color: "var(--color-text-muted)",
																						fontSize: "0.75rem",
																						fontFamily: "monospace",
																						marginTop: "0.25rem",
																					}}
																				>
																					Intent: {utxo.intentHash.slice(0, 16)}
																					...
																				</div>
																			)}
																		</div>
																	))}
																</div>
															</div>
														)}
														{(item.createdUtxos.length > 0 ||
															item.spentUtxos.length > 0) && (
															<div className="utxo-net">
																<span className="utxo-net-label">
																	Net Change:
																</span>
																<span
																	className={`utxo-net-value ${
																		netAmount >= 0 ? "positive" : "negative"
																	}`}
																>
																	{netAmount >= 0 ? "+" : ""}
																	{formatValue(netAmount.toString())}{" "}
																	{getNativeTokenName()}
																</span>
															</div>
														)}
													</div>
												</div>
											);
										})}
								</div>
							)}
						</div>
					)}

					{sessionId && (
						<div className="params-section">
							<h3>Shielded Transactions</h3>
							<p className="method-description-text">
								Shielded transactions require a viewing key to decrypt and view.
								Connect to the indexer with your viewing key to see these
								transactions.
							</p>
							{shieldedProgress && (
								<div className="info-box">
									<strong>Indexing Progress:</strong>
									<br />
									Highest End Index: {shieldedProgress.highestEndIndex}
									<br />
									Highest Checked End Index:{" "}
									{shieldedProgress.highestCheckedEndIndex}
									<br />
									Highest Relevant End Index:{" "}
									{shieldedProgress.highestRelevantEndIndex}
								</div>
							)}
							{shieldedTransactions.length === 0 ? (
								<p className="no-addresses">
									No shielded transactions found yet.
								</p>
							) : (
								<div className="transaction-list">
									{shieldedTransactions.map((item, index) => (
										<div key={`shielded-${item.transaction.id}-${item.transaction.block.height}-${index}`} className="transaction-item">
											<div className="transaction-header">
												<span>
													Transaction #{item.transaction.id} (Block #
													{item.transaction.block.height})
												</span>
											</div>
											<div className="transaction-details">
												<div>
													<strong>Hash:</strong> {item.transaction.hash}
												</div>
												<div>
													<strong>Status:</strong>{" "}
													{item.transaction.transactionResult.status}
												</div>
												<div>
													<strong>Paid Fees:</strong>{" "}
													{item.transaction.fees.paidFees} DUST
												</div>
												<div>
													<strong>Estimated Fees:</strong>{" "}
													{item.transaction.fees.estimatedFees} DUST
												</div>
												{item.collapsedMerkleTree && (
													<div>
														<strong>Merkle Tree Update:</strong>{" "}
														{item.collapsedMerkleTree.startIndex} -{" "}
														{item.collapsedMerkleTree.endIndex}
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</>
			)}
		</div>
	);
}

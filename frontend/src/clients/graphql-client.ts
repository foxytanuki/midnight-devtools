/**
 * GraphQL Client for Midnight Network Indexer
 * Supports both HTTP queries/mutations and WebSocket subscriptions
 */

import { createClient } from "graphql-ws";
import type { Client, ClientOptions } from "graphql-ws";

export interface GraphQLRequest {
	query: string;
	variables?: Record<string, unknown>;
}

export interface GraphQLResponse<T = unknown> {
	data?: T;
	errors?: Array<{
		message: string;
		locations?: Array<{ line: number; column: number }>;
		path?: Array<string | number>;
	}>;
}

export interface GraphQLClientConfig {
	endpoint: string;
	wsEndpoint?: string;
	timeout?: number;
}

export interface SubscriptionOptions {
	query: string;
	variables?: Record<string, unknown>;
	onNext: (data: unknown) => void;
	onError?: (error: Error) => void;
	onComplete?: () => void;
}

export class GraphQLClient {
	private endpoint: string;
	private wsEndpoint: string | undefined;
	private timeout: number;
	private wsClient: Client | null = null;

	constructor(config: GraphQLClientConfig) {
		this.endpoint = config.endpoint;
		this.wsEndpoint = config.wsEndpoint;
		this.timeout = config.timeout ?? 30000;
	}

	/**
	 * Execute a GraphQL query or mutation
	 */
	async query<T = unknown>(
		query: string,
		variables?: Record<string, unknown>,
	): Promise<T> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeout);

		try {
			const response = await fetch(this.endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					query,
					variables,
				}),
				signal: controller.signal,
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = (await response.json()) as GraphQLResponse<T>;

			if (data.errors && data.errors.length > 0) {
				const errorMessages = data.errors.map((e) => e.message).join(", ");
				throw new Error(`GraphQL error: ${errorMessages}`);
			}

			if (data.data === undefined) {
				throw new Error("GraphQL response missing data");
			}

			return data.data;
		} catch (error) {
			if (error instanceof Error) {
				if (error.name === "AbortError") {
					throw new Error(`Request timeout after ${this.timeout}ms`);
				}
				throw error;
			}
			throw new Error("Unknown error occurred");
		} finally {
			clearTimeout(timeoutId);
		}
	}

	/**
	 * Execute a GraphQL mutation
	 */
	async mutate<T = unknown>(
		mutation: string,
		variables?: Record<string, unknown>,
	): Promise<T> {
		return this.query<T>(mutation, variables);
	}

	/**
	 * Subscribe to a GraphQL subscription via WebSocket
	 * 
	 * @returns A function that can be called to unsubscribe
	 */
	subscribe(options: SubscriptionOptions): () => void {
		if (!this.wsEndpoint) {
			throw new Error("WebSocket endpoint not configured");
		}

		// WebSocketクライアントが存在しない場合は作成
		if (!this.wsClient) {
			const wsOptions: ClientOptions = {
				url: this.wsEndpoint,
				connectionParams: {},
			};

			this.wsClient = createClient(wsOptions);
		}

		return this.wsClient.subscribe(
			{
				query: options.query,
				variables: options.variables,
			},
			{
				next: (data) => {
					if (data.errors && data.errors.length > 0) {
						const errorMessages = data.errors.map((e) => e.message).join(", ");
						const error = new Error(`GraphQL subscription error: ${errorMessages}`);
						if (options.onError) {
							options.onError(error);
						} else {
							console.error(error);
						}
						return;
					}
					if (data.data) {
						options.onNext(data.data);
					}
				},
				error: (error) => {
					if (options.onError) {
						options.onError(error);
					} else {
						console.error("GraphQL subscription error:", error);
					}
				},
				complete: () => {
					if (options.onComplete) {
						options.onComplete();
					}
				},
			},
		);
	}

	/**
	 * Close WebSocket connection
	 */
	dispose(): void {
		if (this.wsClient) {
			this.wsClient.dispose();
			this.wsClient = null;
		}
	}
}

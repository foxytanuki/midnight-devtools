/**
 * Tests for GraphQL Client
 * TDD: Test-driven development for GraphQL client validation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GraphQLClient } from "../graphql-client";

// Mock fetch
global.fetch = vi.fn();

describe("GraphQLClient", () => {
	const mockEndpoint = "http://localhost:8088/graphql";
	let client: GraphQLClient;

	beforeEach(() => {
		client = new GraphQLClient({ endpoint: mockEndpoint });
		vi.clearAllMocks();
	});

	describe("query", () => {
		it("should execute a valid GraphQL query", async () => {
			const mockResponse = {
				data: {
					blocks: [
						{ number: 1, hash: "0x123" },
						{ number: 2, hash: "0x456" },
					],
				},
			};

			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const query = `
        query {
          blocks(offset: 0, limit: 10) {
            number
            hash
          }
        }
      `;

			const result = await client.query(query);

			expect(global.fetch).toHaveBeenCalledWith(
				mockEndpoint,
				expect.objectContaining({
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						query,
						variables: undefined,
					}),
				}),
			);

			expect(result).toEqual(mockResponse.data);
		});

		it("should handle GraphQL errors", async () => {
			const mockResponse = {
				errors: [
					{ message: "Field 'id' doesn't exist on type 'Transaction'" },
				],
			};

			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const query = `query { transactions(offset: 0, limit: 10) { id } }`;

			await expect(client.query(query)).rejects.toThrow(
				"GraphQL error: Field 'id' doesn't exist on type 'Transaction'",
			);
		});

		it("should handle HTTP errors", async () => {
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 500,
			});

			const query = `query { blocks(offset: 0, limit: 10) { number } }`;

			await expect(client.query(query)).rejects.toThrow(
				"HTTP error! status: 500",
			);
		});

		it("should handle timeout", async () => {
			client = new GraphQLClient({
				endpoint: mockEndpoint,
				timeout: 100,
			});

			const abortError = new Error("Aborted");
			abortError.name = "AbortError";

			(global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
				() => {
					return new Promise((_, reject) => {
						setTimeout(() => {
							reject(abortError);
						}, 200);
					});
				},
			);

			const query = `query { blocks(offset: 0, limit: 10) { number } }`;

			await expect(client.query(query)).rejects.toThrow(
				"Request timeout after 100ms",
			);
		});

		it("should include variables in request", async () => {
			const mockResponse = { data: { result: "success" } };

			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const query = `query($hash: String!) { transaction(hash: $hash) { hash } }`;
			const variables = { hash: "0x123" };

			await client.query(query, variables);

			expect(global.fetch).toHaveBeenCalledWith(
				mockEndpoint,
				expect.objectContaining({
					body: JSON.stringify({
						query,
						variables,
					}),
				}),
			);
		});
	});
});


/**
 * Tests for GraphQL query builders
 * TDD: Test-driven development for query validation
 */

import { describe, it, expect } from "vitest";
import {
	buildLatestBlockQuery,
	buildBlockByHeightQuery,
	buildBlockByHashQuery,
	buildTransactionsQuery,
	buildTransactionByHashQuery,
	buildTransactionsByHashQuery,
} from "../graphql-queries";

describe("GraphQL Query Builders", () => {
	describe("buildLatestBlockQuery", () => {
		it("should build a valid latest block query", () => {
			const query = buildLatestBlockQuery();
			expect(query).toContain("block {");
			expect(query).toContain("hash");
			expect(query).toContain("height");
			expect(query).toContain("timestamp");
		});

		it("should not contain invalid fields", () => {
			const query = buildLatestBlockQuery();
			expect(query).not.toContain("id");
			expect(query).not.toContain("transactionCount");
		});
	});

	describe("buildBlockByHeightQuery", () => {
		it("should build a valid block by height query", () => {
			const query = buildBlockByHeightQuery(100);
			expect(query).toContain("block(offset: { height: 100 })");
			expect(query).toContain("hash");
			expect(query).toContain("height");
		});
	});

	describe("buildTransactionsQuery", () => {
		it("should build a valid transactions query with identifier", () => {
			const identifier = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			const query = buildTransactionsQuery(identifier);
			expect(query).toContain(`transactions(offset: { identifier: "${identifier}" })`);
			expect(query).toContain("hash");
			expect(query).toContain("block {");
		});

		it("should not contain invalid fields", () => {
			const identifier = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			const query = buildTransactionsQuery(identifier);
			expect(query).not.toContain('id');
		});
	});

	describe("buildTransactionByHashQuery", () => {
		it("should build a valid transaction hash query", () => {
			const hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			const query = buildTransactionByHashQuery(hash);
			expect(query).toContain(`transactions(offset: { hash: "${hash}" })`);
			expect(query).toContain("hash");
			expect(query).toContain("block {");
		});
	});

	describe("buildTransactionsByHashQuery", () => {
		it("should build a valid transactions by hash query", () => {
			const hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			const query = buildTransactionsByHashQuery(hash);
			expect(query).toContain(`transactions(offset: { hash: "${hash}" })`);
			expect(query).toContain("hash");
		});
	});

	describe("buildBlockByHashQuery", () => {
		it("should build a valid block by hash query", () => {
			const hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			const query = buildBlockByHashQuery(hash);
			expect(query).toContain(`block(offset: { hash: "${hash}" })`);
			expect(query).toContain("hash");
			expect(query).toContain("height");
		});
	});
});


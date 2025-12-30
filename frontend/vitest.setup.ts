/**
 * Vitest setup file
 */

import { vi } from "vitest";

// Mock window.location.hash
Object.defineProperty(window, "location", {
	value: {
		hash: "",
	},
	writable: true,
});

// Define global for TypeScript
declare global {
	var global: typeof globalThis;
	var fetch: typeof window.fetch;
}

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
};

global.localStorage = localStorageMock as unknown as Storage;
global.global = globalThis;

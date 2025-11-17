/// <reference types="vite/client" />

declare global {
	var global: typeof globalThis;
	var fetch: typeof window.fetch;
}

export {};

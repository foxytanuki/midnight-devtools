import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), wasm(), topLevelAwait()],
	optimizeDeps: {
		exclude: ["@midnight-ntwrk/wallet-sdk-address-format"],
	},
	define: {
		global: "globalThis",
	},
	resolve: {
		alias: {
			buffer: "buffer",
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					// Midnight関連のパッケージをまとめる
					if (id.includes("@midnight-ntwrk")) {
						// 大きなパッケージを個別に分割
						if (id.includes("@midnight-ntwrk/ledger-v6")) {
							return "midnight-ledger";
						}
						if (id.includes("@midnight-ntwrk/compact-runtime")) {
							return "midnight-runtime";
						}
						if (id.includes("@midnight-ntwrk/midnight-js")) {
							return "midnight-js";
						}
						if (id.includes("@midnight-ntwrk/zswap")) {
							return "midnight-zswap";
						}
						return "midnight-vendor";
					}
					// React関連
					if (id.includes("react") || id.includes("react-dom")) {
						return "react-vendor";
					}
					// GraphQL関連
					if (id.includes("graphql")) {
						return "graphql-vendor";
					}
					// RxJS関連
					if (id.includes("rxjs")) {
						return "rxjs-vendor";
					}
					// fp-ts関連
					if (id.includes("fp-ts")) {
						return "fp-ts-vendor";
					}
					// node_modulesのその他のパッケージ
					if (id.includes("node_modules")) {
						return "vendor";
					}
				},
			},
		},
		chunkSizeWarningLimit: 600,
	},
});

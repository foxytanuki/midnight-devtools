import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Buffer } from "buffer";
import "./index.css";
import App from "./App.tsx";

// Make Buffer available globally for @midnight-ntwrk/wallet-sdk-address-format
(window as unknown as Window & { Buffer: typeof Buffer }).Buffer = Buffer;
(globalThis as unknown as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;

const rootElement = document.getElementById("root");
if (rootElement) {
	createRoot(rootElement).render(
		<StrictMode>
			<App />
		</StrictMode>,
	);
}

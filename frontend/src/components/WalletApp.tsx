import { useEffect, useState } from "react";
import { WalletConnection } from "./WalletConnection";
import { WalletIndexedData } from "./WalletIndexedData";
import "../App.css";

type TabType = "connection" | "indexed-data";

export function WalletApp() {
	// Get initial tab from URL hash query params, default to "connection"
	const getInitialTab = (): TabType => {
		const hash = window.location.hash.slice(1);
		if (hash.includes("?")) {
			const queryString = hash.split("?")[1];
			const params = new URLSearchParams(queryString);
			const tab = params.get("tab") as TabType | null;
			if (tab && ["connection", "indexed-data"].includes(tab)) {
				return tab;
			}
		}
		return "connection";
	};

	const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());

	// Watch for hash changes to update tab state
	useEffect(() => {
		const handleHashChange = () => {
			const hash = window.location.hash.slice(1);
			let newTab: TabType = "connection";
			if (hash.includes("?")) {
				const queryString = hash.split("?")[1];
				const params = new URLSearchParams(queryString);
				const tab = params.get("tab") as TabType | null;
				if (tab && ["connection", "indexed-data"].includes(tab)) {
					newTab = tab;
				}
			}
			setActiveTab(newTab);
		};

		window.addEventListener("hashchange", handleHashChange);
		return () => window.removeEventListener("hashchange", handleHashChange);
	}, []);

	// Update URL hash query params when tab changes
	const handleTabChange = (tab: TabType) => {
		setActiveTab(tab);
		const hash = window.location.hash.slice(1);
		const toolId = hash.split("?")[0] || "wallet";
		const params = new URLSearchParams();
		params.set("tab", tab);
		window.location.hash = `${toolId}?${params.toString()}`;
	};

	const tabs: Array<{ id: TabType; label: string }> = [
		{ id: "connection", label: "Connection" },
		{ id: "indexed-data", label: "Indexed Data" },
	];

	return (
		<div className="app">
			<header className="header">
				<h1>Midnight Network Wallet Connection</h1>
			</header>

			<main className="main">
				<div className="sidebar">
					<div className="tabs">
						{tabs.map((tab) => (
							<button
								key={tab.id}
								type="button"
								className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
								onClick={() => handleTabChange(tab.id)}
							>
								{tab.label}
							</button>
						))}
					</div>
				</div>

				<div className="content">
					{activeTab === "connection" && <WalletConnection />}
					{activeTab === "indexed-data" && <WalletIndexedData />}
				</div>
			</main>
		</div>
	);
}

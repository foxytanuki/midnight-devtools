import { useState } from "react";
import { WalletConnection } from "./WalletConnection";
import { WalletIndexedData } from "./WalletIndexedData";
import "../App.css";

type TabType = "connection" | "indexed-data";

export function WalletApp() {
	const [activeTab, setActiveTab] = useState<TabType>("connection");

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
								onClick={() => setActiveTab(tab.id)}
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


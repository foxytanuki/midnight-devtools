import { useEffect, useState } from "react";
import {
	getDefaultTool,
	getToolById,
	TOOLS,
	type ToolConfig,
} from "./config/tools-config";
import { useNetwork } from "./contexts/NetworkContext";
import { type NetworkId } from "./utils/network-config";
import "./App.css";

function App() {
	const [currentTool, setCurrentTool] = useState<ToolConfig>(getDefaultTool());
	const { currentNetwork, setNetwork } = useNetwork();

	useEffect(() => {
		// Determine tool from URL hash
		const hash = window.location.hash.slice(1);
		const tool = hash ? getToolById(hash) : null;

		if (tool) {
			setCurrentTool(tool);
		} else {
			setCurrentTool(getDefaultTool());
		}

		// Watch for hash changes
		const handleHashChange = () => {
			const newHash = window.location.hash.slice(1);
			const newTool = newHash ? getToolById(newHash) : null;

			if (newTool) {
				setCurrentTool(newTool);
			} else {
				setCurrentTool(getDefaultTool());
			}
		};

		window.addEventListener("hashchange", handleHashChange);
		return () => window.removeEventListener("hashchange", handleHashChange);
	}, []);

	const handleToolChange = (tool: ToolConfig) => {
		setCurrentTool(tool);
		window.location.hash = tool.id;
	};

	const handleTitleClick = () => {
		window.location.hash = "";
		setCurrentTool(getDefaultTool());
	};

	const CurrentToolComponent = currentTool.component;

	return (
		<div className="app-router">
			<nav className="app-nav">
				<a
					href="#"
					onClick={(e) => {
						e.preventDefault();
						handleTitleClick();
					}}
					className="app-nav-title"
					style={{ textDecoration: "none" }}
				>
					<img src="/midnight.png" alt="Midnight" className="app-nav-logo" />
					Midnight DevTools
				</a>
				<div className="app-nav-right">
					<div className="app-nav-buttons">
						{TOOLS.map((tool) => (
							<button
								key={tool.id}
								type="button"
								className={`nav-button ${
									currentTool.id === tool.id ? "active" : ""
								}`}
								onClick={() => handleToolChange(tool)}
								title={tool.description}
							>
								{tool.name}
							</button>
						))}
					</div>
					{currentNetwork.explorerUrl && (
						<a
							href={currentNetwork.explorerUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="explorer-link-header"
							title="Open in Polkadot.js.org Explorer"
						>
							Polkadot Explorer
							<svg
								width="12"
								height="12"
								viewBox="0 0 12 12"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								className="external-link-icon"
							>
								<path
									d="M10.5 1.5L1.5 10.5M10.5 1.5H6.75M10.5 1.5V5.25"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</a>
					)}
					<div className="network-selector">
						<select
							value={currentNetwork.id}
							onChange={(e) => setNetwork(e.target.value as NetworkId)}
							className="network-select"
						>
							<option value="testnet-02">testnet-02</option>
							<option value="0.18-undeployed1-kitsunesh">
								0.18-undeployed1-kitsunesh
							</option>
						</select>
					</div>
				</div>
			</nav>
			<CurrentToolComponent />
		</div>
	);
}

export default App;

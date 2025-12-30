import { Suspense, useEffect, useRef, useState } from "react";
import {
	getDefaultTool,
	getToolById,
	TOOLS,
	type ToolConfig,
} from "./config/tools-config";
import { useNetwork } from "./contexts/NetworkContext";
import {
	NETWORKS,
	NETWORK_ORDER,
	type NetworkId,
	VERSION_GROUPS,
} from "./utils/network-config";
import "./App.css";

function App() {
	const [currentTool, setCurrentTool] = useState<ToolConfig>(getDefaultTool());
	const { currentNetwork, setNetwork } = useNetwork();
	const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

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

	// ドロップダウン外クリックで閉じる
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsNetworkDropdownOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleNetworkSelect = (networkId: NetworkId) => {
		setNetwork(networkId);
		setIsNetworkDropdownOpen(false);
	};

	// バージョングループごとにネットワークをグループ化
	const groupedNetworks = VERSION_GROUPS.map((group) => ({
		...group,
		networks: NETWORK_ORDER.filter(
			(id) => NETWORKS[id].version === group.version,
		).map((id) => NETWORKS[id]),
	}));

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
					<div className="network-selector" ref={dropdownRef}>
						<button
							type="button"
							className="network-dropdown-trigger"
							onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
						>
							<span className="network-dropdown-value">
								{currentNetwork.name}
							</span>
							<svg
								width="10"
								height="6"
								viewBox="0 0 10 6"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								className={`network-dropdown-arrow ${isNetworkDropdownOpen ? "open" : ""}`}
							>
								<path
									d="M1 1L5 5L9 1"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</button>
						{isNetworkDropdownOpen && (
							<div className="network-dropdown-menu">
								{groupedNetworks.map((group, groupIndex) => (
									<div key={group.version} className="network-dropdown-group">
										{groupIndex > 0 && (
											<div className="network-dropdown-separator" />
										)}
										<div className="network-dropdown-group-label">
											{group.label}
										</div>
										{group.networks.map((network) => (
											<button
												key={network.id}
												type="button"
												className={`network-dropdown-item ${currentNetwork.id === network.id ? "active" : ""}`}
												onClick={() => handleNetworkSelect(network.id)}
											>
												{network.name}
											</button>
										))}
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</nav>
			<Suspense
				fallback={
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							minHeight: "400px",
							fontSize: "1.2rem",
							color: "var(--color-text-secondary)",
						}}
					>
						Loading...
					</div>
				}
			>
				<CurrentToolComponent />
			</Suspense>
		</div>
	);
}

export default App;

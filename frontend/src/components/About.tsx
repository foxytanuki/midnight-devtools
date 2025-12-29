import "../App.css";

const linkStyle = {
	color: "var(--color-primary)",
	textDecoration: "underline",
} as const;

const listStyle = {
	listStyle: "disc",
	paddingLeft: "1.5rem",
} as const;

export function About() {
	return (
		<div className="app">
			<main
				className="main"
				style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}
			>
				<div className="method-panel">
					<h2>About Midnight DevTools</h2>
					<p className="method-description-text">
						Midnight DevTools is a collection of developer tools for interacting
						with the Midnight Network.
						<br />
						<br />
						This project was developed during the Midnight London Hackathon held
						on November 17-19, 2025. While not created as a hackathon
						submission, it was built with a research-oriented approach and the
						goal of helping developers explore and work with the Midnight
						Network ecosystem.
					</p>

					<div className="params-section">
						<h3>Author</h3>
						<div className="connection-info">
							<div className="info-item">
								<span>Developer:</span>
								<span>foxytanuki</span>
							</div>
							<div className="info-item">
								<span>Twitter:</span>
								<span>
									<a
										href="https://twitter.com/foxytanuki"
										target="_blank"
										rel="noopener noreferrer"
										style={linkStyle}
									>
										@foxytanuki
									</a>
								</span>
							</div>
							<div className="info-item">
								<span>GitHub:</span>
								<span>
									<a
										href="https://github.com/foxytanuki/midnight-devtools"
										target="_blank"
										rel="noopener noreferrer"
										style={linkStyle}
									>
										foxytanuki/midnight-devtools
									</a>
								</span>
							</div>
						</div>
					</div>

					<div className="params-section">
						<h3>Tools</h3>
						<ul className="usage-list" style={listStyle}>
							<li>
								<strong>RPC Explorer:</strong> Explore and execute Midnight
								Network RPC methods
							</li>
							<li>
								<strong>Indexer Explorer:</strong> Query and explore blockchain
								data using the public indexer GraphQL API
							</li>
							<li>
								<strong>Wallet Connection:</strong> Test and verify Midnight
								Network compatible wallet connections
							</li>
						</ul>
					</div>

					<div className="params-section">
						<h3>Resources</h3>
						<ul className="usage-list" style={listStyle}>
							<li>
								<a
									href="https://midnight.network"
									target="_blank"
									rel="noopener noreferrer"
									style={linkStyle}
								>
									Midnight Network
								</a>
							</li>
							<li>
								<a
									href="https://midnight.network/test-faucet"
									target="_blank"
									rel="noopener noreferrer"
									style={linkStyle}
								>
									Midnight Testnet Faucet (testnet-02)
								</a>
							</li>
							<li>
								<a
									href="https://faucet.preview.midnight.network/"
									target="_blank"
									rel="noopener noreferrer"
									style={linkStyle}
								>
									Midnight Preview Faucet (midnight-preview)
								</a>
							</li>
							<li>
								<a
									href="https://www.midnighttransaction.us/"
									target="_blank"
									rel="noopener noreferrer"
									style={linkStyle}
								>
									Midnight Transactions Viewer (testnet-02)
								</a>{" "}
								- An excellent resource. Some parts of this project were
								inspired by its functionality.
							</li>
						</ul>
					</div>
				</div>
			</main>
		</div>
	);
}

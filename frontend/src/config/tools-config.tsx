import type { ComponentType } from "react";
import { About } from "../components/About";
import { IndexerExplorer } from "../components/IndexerExplorer";
import { RpcExplorer } from "../components/RpcExplorer";
import { WalletApp } from "../components/WalletApp";

export interface ToolConfig {
	/**
	 * Unique tool ID (used in URL hash)
	 */
	id: string;

	/**
	 * Tool display name
	 */
	name: string;

	/**
	 * Tool description (optional)
	 */
	description?: string;

	/**
	 * Tool component
	 */
	component: ComponentType;

	/**
	 * Tool icon (optional, for future expansion)
	 */
	icon?: string;
}

/**
 * Available tools configuration
 * To add a new tool, simply add its configuration here
 */
export const TOOLS: ToolConfig[] = [
	{
		id: "rpc",
		name: "RPC Explorer",
		description: "Explore and execute Midnight Network RPC methods",
		component: RpcExplorer,
	},
	{
		id: "indexer",
		name: "Indexer Explorer",
		description:
			"Query and explore blockchain data using the public indexer GraphQL API",
		component: IndexerExplorer,
	},
	{
		id: "wallet",
		name: "Wallet Connection",
		description:
			"Test and verify Midnight Network compatible wallet connections",
		component: WalletApp,
	},
	{
		id: "about",
		name: "About",
		description: "About Midnight DevTools and author information",
		component: About,
	},
];

/**
 * Default tool ID
 */
export const DEFAULT_TOOL_ID = "rpc";

/**
 * Get tool configuration by ID
 */
export function getToolById(id: string): ToolConfig | undefined {
	return TOOLS.find((tool) => tool.id === id);
}

/**
 * Get default tool configuration
 */
export function getDefaultTool(): ToolConfig {
	return getToolById(DEFAULT_TOOL_ID) ?? TOOLS[0];
}

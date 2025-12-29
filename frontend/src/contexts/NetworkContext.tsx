import { createContext, type ReactNode, useContext, useState } from "react";
import {
	getStoredNetworkId,
	NETWORKS,
	type NetworkConfig,
	type NetworkId,
	setStoredNetworkId,
} from "../utils/network-config";

interface NetworkContextType {
	currentNetwork: NetworkConfig;
	setNetwork: (networkId: NetworkId) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: ReactNode }) {
	const [currentNetworkId, setCurrentNetworkId] = useState<NetworkId>(
		getStoredNetworkId(),
	);

	const setNetwork = (networkId: NetworkId) => {
		setCurrentNetworkId(networkId);
		setStoredNetworkId(networkId);
	};

	const currentNetwork = NETWORKS[currentNetworkId];

	return (
		<NetworkContext.Provider value={{ currentNetwork, setNetwork }}>
			{children}
		</NetworkContext.Provider>
	);
}

export function useNetwork() {
	const context = useContext(NetworkContext);
	if (context === undefined) {
		throw new Error("useNetwork must be used within a NetworkProvider");
	}
	return context;
}

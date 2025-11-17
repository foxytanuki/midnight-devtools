/**
 * Hex encoding utilities for GraphQL queries
 */

/**
 * Convert a number to a 32-byte hex-encoded string (64 hex characters)
 * This is the format expected by HexEncoded type in the GraphQL schema
 */
export function numberToHexEncoded(value: number | string): string {
	// Handle empty string or whitespace
	if (typeof value === "string" && (!value || value.trim() === "")) {
		return "0x0000000000000000000000000000000000000000000000000000000000000000";
	}
	
	const num = typeof value === "string" ? parseInt(value.trim(), 10) : value;
	if (isNaN(num) || num < 0) {
		return "0x0000000000000000000000000000000000000000000000000000000000000000";
	}
	
	// Convert to hex and pad to 64 characters (32 bytes)
	const hex = num.toString(16).padStart(64, "0");
	return `0x${hex}`;
}

/**
 * Convert a hex-encoded string to a number
 */
export function hexEncodedToNumber(hex: string): number {
	if (!hex || hex === "0x") {
		return 0;
	}
	
	// Remove 0x prefix if present
	const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
	return parseInt(cleanHex, 16);
}

/**
 * Validate if a string is a valid hex-encoded value
 */
export function isValidHexEncoded(value: string): boolean {
	if (!value || value.trim() === "") {
		return false;
	}
	
	const trimmed = value.trim();
	const cleanValue = trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
	
	// Must be valid hex characters and have even length (for bytes)
	return /^[0-9a-fA-F]+$/.test(cleanValue) && cleanValue.length > 0;
}


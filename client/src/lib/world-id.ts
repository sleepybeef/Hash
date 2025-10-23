// Legacy World ID logic removed. Use @worldcoin/idkit and IDKitWidget for authentication.

// Minimal stub to keep typecheck happy for any legacy imports.
export function useWorldId() {
	return {
		verified: false as boolean,
		async verify() {
			// no-op stub
			return false as boolean;
		},
	};
}

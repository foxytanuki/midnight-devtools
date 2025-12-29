/**
 * Proof Serverステータス確認ユーティリティ
 */

export const checkProofServerStatus = async (
	proverServerUri: string | undefined,
): Promise<boolean> => {
	try {
		if (!proverServerUri) return false;
		const response = await fetch(proverServerUri);
		if (!response.ok) {
			return false;
		}
		return true;
	} catch (e) {
		console.log(e);
		return false;
	}
};

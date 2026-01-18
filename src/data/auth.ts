/**
 * Fetches the /api/login endpoint of the backend to check if the given password is valid
 * @param password Password input
 * @returns ACCOUNT_ROLE instance based on the password that has been entered
 */
export async function checkPassword(password: string): Promise<ACCOUNT_ROLE> {
	const res = await fetch(`${import.meta.env.VITE_LLM_URL}${!import.meta.env.VITE_LLM_PORT ? '' : ':' + import.meta.env.VITE_LLM_PORT}/api/login`, {
		method: 'POST',
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json",
		},
		body: JSON.stringify({
			password: password
		})
	});
	const success = await res.json();
	if (success.role == "student") {
		return ACCOUNT_ROLE.STUDENT;
	}
	else if (success.role == "root") {
		return ACCOUNT_ROLE.ROOT;
	}
	else {
		return ACCOUNT_ROLE.INVALID;
	}
};

export enum ACCOUNT_ROLE {
	ROOT, STUDENT, INVALID
}
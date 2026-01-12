/**
 * Fetches the /api/login endpoint of the backend to check if the given password is valid
 * @param password Password input
 * @returns Boolean if the backend accepted the password - asynchronous
 */
export async function checkPassword(password: string): Promise<boolean> {
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
	if (success.success) {
		return true;
	}
	return false;
};

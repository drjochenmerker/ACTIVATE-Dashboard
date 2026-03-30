import bcrypt from "bcryptjs";

export type LoginResult = {
	role: ACCOUNT_ROLE;
	token?: string;
};

/**
 * Fetches the /api/login endpoint of the backend to check if the given password is valid.
 * The backend returns the JWT that must be sent with protected instructor requests.
 *
 * @param password Password input
 * @returns Role and optional JWT token for the current session
 */
export async function checkPassword(password: string): Promise<LoginResult> {
	try {
		// Keep the existing backend-compatible password flow.
		const hash = await bcrypt.hash(password, 10);
		const res = await fetch(`${import.meta.env.VITE_LLM_URL}${!import.meta.env.VITE_LLM_PORT ? '' : ':' + import.meta.env.VITE_LLM_PORT}/api/login`, {
			method: 'POST',
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json",
			},
			body: JSON.stringify({
				password: hash
			})
		});

		const success = await res.json();
		if (success.role == "student") {
			return { role: ACCOUNT_ROLE.STUDENT, token: success.token };
		}
		else if (success.role == "root") {
			return { role: ACCOUNT_ROLE.ROOT, token: success.token };
		}
		else {
			return { role: ACCOUNT_ROLE.INVALID };
		}
	}
	catch (err) {
		console.error("Error during login: ", err);
		return { role: ACCOUNT_ROLE.INVALID };
	}
};

export enum ACCOUNT_ROLE {
	ROOT, STUDENT, INVALID
}
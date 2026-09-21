import { json } from '@sveltejs/kit';
import { verifyUser, createSession } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const { username, password } = await request.json();
	const user = await verifyUser(username, password);
	if (!user) return json({ error: 'Credenciales inválidas' }, { status: 401 });
	const token = createSession(user.id);
	cookies.set('session', token, { path: '/', httpOnly: true, sameSite: 'lax', secure: false, maxAge: 60 * 60 * 24 * 7 });
	return json({ ok: true, user });
};

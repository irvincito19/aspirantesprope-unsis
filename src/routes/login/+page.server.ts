import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { verifyUser, createSession } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = String(data.get('username') || '').trim().toLowerCase();
		const password = String(data.get('password') || '');

		const user = await verifyUser(username, password);
		if (!user) return fail(401, { error: 'Usuario o contraseña incorrectos' });

		const token = createSession(user.id);
		cookies.set('session', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			maxAge: 60 * 60 * 24 * 7
		});
		throw redirect(303, '/');
	}
};

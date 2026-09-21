import { redirect } from '@sveltejs/kit';
import { deleteSession } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	const token = cookies.get('session');
	if (token) deleteSession(token);
	cookies.delete('session', { path: '/' });
	throw redirect(303, '/login');
};

export const GET: RequestHandler = async ({ cookies }) => {
	const token = cookies.get('session');
	if (token) deleteSession(token);
	cookies.delete('session', { path: '/' });
	throw redirect(303, '/login');
};

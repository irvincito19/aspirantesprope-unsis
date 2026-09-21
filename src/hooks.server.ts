import type { Handle } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('session');
	if (token) {
		const user = validateSession(token);
		if (user) {
			event.locals.user = user;
		} else {
			event.cookies.delete('session', { path: '/' });
		}
	}

	const path = event.url.pathname;

	// Rutas públicas
	const publicPaths = ['/login', '/api/auth/login'];
	const isPublic = publicPaths.some((p) => path.startsWith(p));
	const isStatic = path.startsWith('/api/dashboard/share');

	if (!isPublic && !isStatic && !event.locals.user) {
		// Permitir /dashboard con token share
		if (path.startsWith('/dashboard') && event.url.searchParams.has('share')) {
			// validar share token más adelante
		} else if (path !== '/' && !path.startsWith('/api')) {
			// redirigir a login si es página
			if (event.request.method === 'GET' && !path.startsWith('/api')) {
				const isApi = path.startsWith('/api');
				if (!isApi) {
					// no redirigir API, dejar pasar para que retorne 401
				}
			}
		}
	}

	// Guards por rol — solo admin puede ver dashboard/reportes y admin panel
	if (path.startsWith('/admin') && event.locals.user?.role !== 'admin') {
		if (event.locals.user) {
			return new Response(null, { status: 303, headers: { location: '/evaluar' } });
		}
	}
	if (path.startsWith('/dashboard') && !event.url.searchParams.has('share')) {
		if (!event.locals.user) {
			return new Response(null, { status: 303, headers: { location: '/login' } });
		}
		if (event.locals.user.role !== 'admin') {
			return new Response(null, { status: 303, headers: { location: '/evaluar' } });
		}
	}
	if (path.startsWith('/api/stats') && event.locals.user?.role !== 'admin' && !event.url.searchParams.has('share')) {
		if (event.locals.user) {
			return new Response(JSON.stringify({ error: 'Solo admin puede ver reportes' }), { status: 403, headers: { 'content-type': 'application/json' } });
		}
	}

	if ((path.startsWith('/evaluar') || path.startsWith('/api/evaluaciones')) && !event.locals.user) {
		return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 });
	}

	const response = await resolve(event);
	return response;
};

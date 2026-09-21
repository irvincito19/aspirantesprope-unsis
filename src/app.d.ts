// See https://svelte.dev/docs/kit/$app-types
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user?: {
				id: string;
				username: string;
				role: 'admin' | 'docente';
				nombreCompleto: string;
			};
		}
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

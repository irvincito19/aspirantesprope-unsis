<script lang="ts">
	import { enhance } from '$app/forms';
	let { form } = $props();
</script>

<div class="flex min-h-[70vh] items-center justify-center px-4 py-10">
	<form method="POST" use:enhance class="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
		<div class="mb-6 text-center">
			<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#7D2323] font-black text-white">U</div>
			<h1 class="mt-3 text-xl font-bold text-[#7D2323]">Acceso UNSIS</h1>
			<p class="text-sm text-zinc-500">Apreciación estudiantil propedéutico</p>
		</div>

		{#if form?.error}
			<p class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{form.error}</p>
		{/if}

		<label class="mb-1 block text-sm font-medium">Usuario</label>
		<input name="username" required class="mb-4 w-full rounded-lg border px-3 py-2 focus:border-[#7D2323] focus:outline-none" placeholder="admin" />

		<label class="mb-1 block text-sm font-medium">Contraseña</label>
		<input name="password" type="password" required class="mb-6 w-full rounded-lg border px-3 py-2 focus:border-[#7D2323] focus:outline-none" placeholder="••••••••" />

		<button class="w-full rounded-lg bg-[#7D2323] py-2.5 font-semibold text-white hover:bg-[#631C1C]">Entrar</button>
	</form>
</div>

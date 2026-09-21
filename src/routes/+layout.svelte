<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children, data } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if data?.user}
	<header class="border-b border-[#E5E7EB] bg-white sticky top-0 z-40">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
			<a href="/" class="flex items-center gap-3">
				<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7D2323] font-black text-white">U</div>
				<div>
					<p class="text-sm font-bold leading-none text-[#7D2323]">UNSIS</p>
					<p class="text-xs text-zinc-500">Apreciación Propedéutico</p>
				</div>
			</a>
			<nav class="flex items-center gap-1 text-sm">
				<a href="/evaluar" class="rounded-lg px-3 py-2 hover:bg-zinc-50">Evaluar</a>
				{#if data.user.role === 'admin'}
					<a href="/dashboard" class="rounded-lg px-3 py-2 hover:bg-zinc-50">Dashboard</a>
					<a href="/admin" class="rounded-lg bg-[#7D2323] px-3 py-2 text-white hover:bg-[#631C1C]">Admin</a>
				{/if}
				<span class="ml-2 hidden text-xs text-zinc-500 sm:inline">{data.user.nombreCompleto} ({data.user.role})</span>
				<form method="POST" action="/logout" class="ml-2">
					<button class="rounded-lg border px-3 py-1.5 text-xs hover:bg-zinc-50">Salir</button>
				</form>
			</nav>
		</div>
	</header>
{/if}

<main class="min-h-screen bg-[#F8F9FA]">{@render children()}</main>

<footer class="border-t bg-white py-4 text-center text-xs text-zinc-500">
	UNSIS · Sistema de Apreciación Estudiantil Propedéutico 2026 · unsis1.irisvisual.com
</footer>

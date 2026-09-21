<script lang="ts">
	let { data } = $props();
	let q = $state('');
</script>

<div class="mx-auto max-w-6xl px-4 py-6">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-[#7D2323]">Evaluar aspirantes</h1>
			<p class="text-sm text-zinc-500">Hola {data.user.nombreCompleto} · {data.evaluados.length}/{data.alumnos.length} evaluados</p>
		</div>
		<form method="GET" class="flex gap-2">
			<input name="q" value={q} placeholder="Buscar matrícula o nombre" class="rounded-lg border px-3 py-2 text-sm w-64" />
			<button class="rounded-lg bg-[#7D2323] px-4 py-2 text-sm text-white">Buscar</button>
		</form>
	</div>

	<div class="mt-2 h-2 w-full rounded-full bg-zinc-200">
		<div class="h-2 rounded-full bg-[#7D2323] transition-all" style="width: {(data.evaluados.length / Math.max(1, data.alumnos.length)) * 100}%"></div>
	</div>

	<div class="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
		{#each data.alumnos as a}
			{@const done = data.evaluados.includes(a.matricula)}
			<a href="/evaluar/{a.matricula}" class="rounded-xl border bg-white p-4 shadow-sm hover:border-[#7D2323] {done ? 'border-green-200 bg-green-50/50' : ''}">
				<div class="flex items-start justify-between">
					<p class="font-mono text-xs text-zinc-500">{a.matricula} {#if a.matricula_original}<span class="text-[10px]">({a.matricula_original})</span>{/if}</p>
					{#if done}<span class="rounded-full bg-[#1C5E35] px-2 py-0.5 text-xs text-white">Evaluado</span>{:else}<span class="rounded-full bg-zinc-100 px-2 py-0.5 text-xs">Pendiente</span>{/if}
				</div>
				<p class="mt-1 text-sm font-semibold">{a.nombre}</p>
				<p class="text-xs text-zinc-500">{a.grupo}</p>
			</a>
		{/each}
	</div>
</div>

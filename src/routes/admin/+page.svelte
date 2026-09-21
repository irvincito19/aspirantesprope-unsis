<script lang="ts">
	let { data } = $props();
	let tab: 'alumnos' | 'docentes' | 'evaluaciones' | 'importar' = $state('alumnos');
	let importResult: any = $state(null);
	let nuevaMatricula = $state('');
	let nuevoNombre = $state('');

	async function importarCSV(e: Event) {
		const form = e.target as HTMLFormElement;
		const fd = new FormData(form);
		const res = await fetch('/api/alumnos/import', { method: 'POST', body: fd });
		importResult = await res.json();
		if (importResult.ok) location.reload();
	}

	async function crearAlumno(e: Event) {
		e.preventDefault();
		const res = await fetch('/api/alumnos/import', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ alumnos: [{ matricula: nuevaMatricula, nombre: nuevoNombre }] })
		});
		const j = await res.json();
		if (j.ok) location.reload();
		else alert(j.error);
	}
</script>

<div class="mx-auto max-w-6xl px-4 py-6">
	<h1 class="text-2xl font-bold text-[#7D2323]">Panel Admin</h1>
	<p class="text-sm text-zinc-500">Total alumnos {data.stats.totalAlumnos} · Docentes {data.stats.totalDocentes} · Evaluaciones {data.stats.totalEvals}</p>

	<div class="mt-4 flex gap-2">
		{#each ['alumnos','docentes','evaluaciones','importar'] as t}
			<button onclick={() => (tab = t as any)} class="rounded-full px-4 py-2 text-sm {tab===t ? 'bg-[#7D2323] text-white' : 'border bg-white'}">{t}</button>
		{/each}
		<a href="/dashboard" class="ml-auto rounded-full border bg-white px-4 py-2 text-sm">Ver dashboard →</a>
	</div>

	{#if tab === 'alumnos'}
		<div class="mt-6 rounded-xl border bg-white p-4">
			<h2 class="font-semibold">Alumnos ({data.alumnos.length})</h2>
			<form onsubmit={crearAlumno} class="mt-3 flex gap-2">
				<input bind:value={nuevaMatricula} placeholder="Matrícula" class="rounded-lg border px-3 py-2 text-sm" required />
				<input bind:value={nuevoNombre} placeholder="Nombre completo" class="flex-1 rounded-lg border px-3 py-2 text-sm" required />
				<button class="rounded-lg bg-[#7D2323] px-4 py-2 text-sm text-white">Agregar</button>
			</form>
			<div class="mt-4 max-h-[60vh] overflow-auto">
				<table class="w-full text-sm">
					<thead class="sticky top-0 bg-zinc-50"><tr><th class="p-2 text-left">Matrícula</th><th class="p-2 text-left">Nombre</th><th class="p-2">Grupo</th><th class="p-2">Original</th></tr></thead>
					<tbody>
						{#each data.alumnos as a}
							<tr class="border-t"><td class="p-2 font-mono text-xs">{a.matricula}</td><td class="p-2">{a.nombre}</td><td class="p-2 text-center text-xs">{a.grupo}</td><td class="p-2 text-xs">{a.matricula_original || '-'}</td></tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	{#if tab === 'docentes'}
		<div class="mt-6 rounded-xl border bg-white p-4">
			<h2 class="font-semibold">Docentes y admin</h2>
			<table class="mt-3 w-full text-sm">
				<thead class="bg-zinc-50"><tr><th class="p-2 text-left">Usuario</th><th class="p-2 text-left">Nombre</th><th class="p-2">Rol</th></tr></thead>
				<tbody>
					{#each data.users as u}
						<tr class="border-t"><td class="p-2 font-mono text-xs">{u.username}</td><td class="p-2">{u.nombre_completo}</td><td class="p-2 text-center"><span class="rounded-full px-2 py-1 text-xs {u.role==='admin'?'bg-[#FBE9E9] text-[#7D2323]':'bg-zinc-100'}">{u.role}</span></td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	{#if tab === 'evaluaciones'}
		<div class="mt-6 rounded-xl border bg-white p-4">
			<h2 class="font-semibold">Últimas evaluaciones</h2>
			<div class="overflow-auto">
				<table class="mt-3 w-full text-xs">
					<thead class="bg-zinc-50"><tr><th class="p-2 text-left">Alumno</th><th class="p-2 text-left">Docente</th><th class="p-2">Prom</th><th class="p-2">Obs</th></tr></thead>
					<tbody>
						{#each data.evaluaciones as e}
							{@const prom = ((e.asistencia_puntualidad+e.participacion_compromiso+e.responsabilidad_cumplimiento+e.disciplina_normas+e.respeto_convivencia+e.trabajo_colaborativo+e.comunicacion_expresion+e.actitud_motivacion)/8).toFixed(1)}
							<tr class="border-t"><td class="p-2">{e.alumno_nombre} <span class="text-zinc-400">({e.alumno_matricula})</span></td><td class="p-2">{e.docente_nombre}</td><td class="p-2 text-center font-bold {Number(prom)<3?'text-red-600':''}">{prom}</td><td class="p-2 max-w-[200px] truncate">{e.observaciones || '-'}</td></tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	{#if tab === 'importar'}
		<div class="mt-6 rounded-xl border bg-white p-6">
			<h2 class="font-semibold">Importar CSV</h2>
			<p class="text-sm text-zinc-500">Formato: <code class="bg-zinc-100 px-1">matricula,nombre</code> · UTF-8 · Ejemplo: <code class="bg-zinc-100 px-1">0673,ANTONIO PEREZ DULCE AMALI</code></p>
			<form onsubmit={(e)=>{e.preventDefault(); importarCSV(e);}} class="mt-4 flex flex-col gap-3" enctype="multipart/form-data">
				<input type="file" name="file" accept=".csv" class="rounded-lg border p-2 text-sm" required />
				<button class="rounded-lg bg-[#7D2323] px-4 py-2 text-sm text-white">Subir CSV</button>
			</form>
			{#if importResult}
				<pre class="mt-4 rounded-lg bg-zinc-50 p-3 text-xs overflow-auto">{JSON.stringify(importResult, null, 2)}</pre>
			{/if}
			<div class="mt-4 rounded-lg bg-[#FBE9E9] p-3 text-xs text-[#7D2323]">Tip: Para "Sin ficha" escribe <code>Sin ficha</code> como matrícula; se generará SF-001, SF-002...</div>
		</div>
	{/if}
</div>

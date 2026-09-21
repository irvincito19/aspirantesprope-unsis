<script lang="ts">
	let { data } = $props();

	function toCSV() {
		const header = ['matricula','alumno','docente','asistencia','participacion','responsabilidad','disciplina','respeto','colaborativo','comunicacion','actitud','promedio','observaciones','alerta'];
		const lines = [header.join(',')];
		for (const r of data.rows) {
			lines.push([r.matricula, `"${r.alumno_nombre}"`, r.docente_nombre, r.asistencia_puntualidad, r.participacion_compromiso, r.responsabilidad_cumplimiento, r.disciplina_normas, r.respeto_convivencia, r.trabajo_colaborativo, r.comunicacion_expresion, r.actitud_motivacion, r.promedio, `"${(r.observaciones||'').replace(/"/g,'""')}"`, r.alerta?'SI':'NO'].join(','));
		}
		const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a'); a.href = url; a.download = 'evaluaciones-unsis.csv'; a.click();
	}
</script>

<div class="mx-auto max-w-7xl px-4 py-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-2xl font-bold text-[#7D2323]">Dashboard · Visualización</h1>
			<p class="text-sm text-zinc-500">{data.total} evaluaciones · {data.alertaCount} en alerta · Promedio general {data.kpis.promedioGeneral}</p>
		</div>
		<div class="flex gap-2">
			<button onclick={toCSV} class="rounded-lg bg-[#7D2323] px-4 py-2 text-sm text-white">Exportar CSV</button>
			<a href="/dashboard?share=demo-token-7d" class="rounded-lg border bg-white px-4 py-2 text-sm">Link compartible (solo admin)</a>
		</div>
	</div>

	<!-- KPIs -->
	<div class="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
		{#each [['General', data.kpis.promedioGeneral], ['Dim A Acad', data.kpis.dimensionA], ['Dim B Conducta', data.kpis.dimensionB], ['Dim C Transv', data.kpis.dimensionC], ['Disciplina', data.kpis.disciplina], ['Respeto', data.kpis.respeto]] as [k,v]}
			<div class="rounded-xl border bg-white p-3 text-center">
				<p class="text-xs text-zinc-500">{k}</p>
				<p class="text-xl font-black text-[#7D2323]">{v}</p>
			</div>
		{/each}
	</div>

	<!-- Filtros -->
	<form method="GET" class="mt-4 flex flex-wrap gap-2 rounded-xl border bg-white p-3">
		<select name="docente" class="rounded-lg border px-3 py-2 text-sm">
			<option value="">Todos los docentes</option>
			{#each data.docentes as d}<option value={d.username} selected={data.rows.length && false}>{d.nombre_completo} ({d.username})</option>{/each}
		</select>
		<input name="alumno" placeholder="Filtrar alumno / matrícula" class="rounded-lg border px-3 py-2 text-sm flex-1" />
		<button class="rounded-lg bg-[#7D2323] px-4 py-2 text-sm text-white">Filtrar</button>
		<a href="/dashboard" class="rounded-lg border px-4 py-2 text-sm">Limpiar</a>
	</form>

	<!-- Barras por variable -->
	<div class="mt-4 grid gap-3 md:grid-cols-2">
		<div class="rounded-xl border bg-white p-4">
			<h3 class="font-semibold">Promedio por variable</h3>
			<div class="mt-3 space-y-2">
				{#each [['Asistencia', data.kpis.asistencia], ['Participación', data.kpis.participacion], ['Responsabilidad', data.kpis.responsabilidad], ['Disciplina', data.kpis.disciplina], ['Respeto', data.kpis.respeto], ['Colaborativo', data.kpis.colaborativo], ['Comunicación', data.kpis.comunicacion], ['Actitud', data.kpis.actitud]] as [label, val]}
					<div class="flex items-center gap-2 text-sm">
						<span class="w-32 text-xs">{label}</span>
						<div class="flex-1 h-3 rounded-full bg-[#FBE9E9]"><div class="h-3 rounded-full bg-[#7D2323]" style="width: {(Number(val)/5)*100}%"></div></div>
						<span class="w-8 text-right font-bold">{val}</span>
					</div>
				{/each}
			</div>
		</div>
		<div class="rounded-xl border bg-white p-4">
			<h3 class="font-semibold">Alumnos en alerta (&lt;3 o var=1)</h3>
			{#if data.alertaCount === 0}
				<p class="mt-3 text-sm text-green-600">Sin alertas — excelente.</p>
			{:else}
				<ul class="mt-3 space-y-1 text-sm">
					{#each data.rows.filter((r:any)=>r.alerta).slice(0,10) as r}
						<li class="flex justify-between rounded-lg bg-red-50 px-3 py-1 text-red-700"><span>{r.alumno_nombre} ({r.matricula}) · {r.docente_nombre}</span><span class="font-bold">{r.promedio}</span></li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>

	<!-- Tabla -->
	<div class="mt-4 overflow-auto rounded-xl border bg-white">
		<table class="w-full text-xs">
			<thead class="bg-[#7D2323] text-white"><tr><th class="p-2 text-left">Alumno</th><th class="p-2 text-left">Docente</th><th class="p-2">A1</th><th class="p-2">A2</th><th class="p-2">A3</th><th class="p-2">B4</th><th class="p-2">B5</th><th class="p-2">B6</th><th class="p-2">C7</th><th class="p-2">C8</th><th class="p-2">Prom</th><th class="p-2">Obs</th><th class="p-2">Alerta</th></tr></thead>
			<tbody>
				{#each data.rows as r}
					<tr class="border-t hover:bg-zinc-50 {r.alerta?'bg-red-50/60':''}">
						<td class="p-2"><span class="font-mono text-[10px] text-zinc-400">{r.matricula}</span><br/>{r.alumno_nombre}</td>
						<td class="p-2">{r.docente_nombre}</td>
						<td class="p-2 text-center">{r.asistencia_puntualidad}</td>
						<td class="p-2 text-center">{r.participacion_compromiso}</td>
						<td class="p-2 text-center">{r.responsabilidad_cumplimiento}</td>
						<td class="p-2 text-center">{r.disciplina_normas}</td>
						<td class="p-2 text-center">{r.respeto_convivencia}</td>
						<td class="p-2 text-center">{r.trabajo_colaborativo}</td>
						<td class="p-2 text-center">{r.comunicacion_expresion}</td>
						<td class="p-2 text-center">{r.actitud_motivacion}</td>
						<td class="p-2 text-center font-bold">{r.promedio}</td>
						<td class="p-2 max-w-[150px] truncate">{r.observaciones || '-'}</td>
						<td class="p-2 text-center">{r.alerta ? '🔴' : '🟢'}</td>
					</tr>
				{/each}
				{#if data.rows.length === 0}
					<tr><td colspan="13" class="p-6 text-center text-zinc-500">Sin evaluaciones aún. Pide a docentes que evalúen en /evaluar.</td></tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>

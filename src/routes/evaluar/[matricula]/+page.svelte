<script lang="ts">
	import SliderEval from '$lib/components/SliderEval.svelte';
	let { data, form } = $props();

	let v1 = $state(data.existing?.asistencia_puntualidad ?? 3);
	let v2 = $state(data.existing?.participacion_compromiso ?? 3);
	let v3 = $state(data.existing?.responsabilidad_cumplimiento ?? 3);
	let v4 = $state(data.existing?.disciplina_normas ?? 3);
	let v5 = $state(data.existing?.respeto_convivencia ?? 3);
	let v6 = $state(data.existing?.trabajo_colaborativo ?? 3);
	let v7 = $state(data.existing?.comunicacion_expresion ?? 3);
	let v8 = $state(data.existing?.actitud_motivacion ?? 3);

	const promedio = $derived(((v1 + v2 + v3 + v4 + v5 + v6 + v7 + v8) / 8).toFixed(1));
</script>

<div class="mx-auto max-w-3xl px-4 py-6">
	<a href="/evaluar" class="text-sm text-[#7D2323]">← Volver a lista</a>
	<div class="mt-2 rounded-xl border bg-white p-4">
		<p class="font-mono text-xs text-zinc-500">{data.alumno.matricula}</p>
		<h1 class="text-xl font-bold">{data.alumno.nombre}</h1>
		<p class="text-sm text-zinc-500">{data.alumno.grupo} · Evaluador: {data.user.nombreCompleto}</p>
		{#if data.existing}<p class="mt-1 text-xs text-green-600">Ya evaluado — puedes actualizar</p>{/if}
	</div>

	<form method="POST" class="mt-4 space-y-4">
		<div class="rounded-xl bg-[#FBE9E9] px-4 py-3 flex items-center justify-between">
			<span class="text-sm font-semibold text-[#7D2323]">Promedio actual</span>
			<span class="text-2xl font-black text-[#7D2323]">{promedio} / 5.0</span>
		</div>

		<h3 class="font-bold text-[#1C5E35]">A · Compromiso Académico (40%)</h3>
		<SliderEval label="1. Asistencia y puntualidad" description="Llega a tiempo, asiste regularmente, justifica inasistencias." bind:value={v1} name="asistencia_puntualidad" />
		<SliderEval label="2. Participación y compromiso" description="Participa en clase, muestra interés, pregunta y atiende." bind:value={v2} name="participacion_compromiso" />
		<SliderEval label="3. Responsabilidad / cumplimiento" description="Entrega tareas a tiempo y con calidad, trae materiales." bind:value={v3} name="responsabilidad_cumplimiento" />

		<h3 class="font-bold text-[#1C5E35]">B · Convivencia y Conducta (40%)</h3>
		<SliderEval label="4. Disciplina y respeto a normas" description="Respeta reglamento, sigue instrucciones, comportamiento en aula." bind:value={v4} name="disciplina_normas" />
		<SliderEval label="5. Respeto y convivencia" description="Trato respetuoso a docentes y pares, lenguaje adecuado." bind:value={v5} name="respeto_convivencia" />
		<SliderEval label="6. Trabajo colaborativo" description="Colabora en equipo, escucha, aporta, actitud positiva." bind:value={v6} name="trabajo_colaborativo" />

		<h3 class="font-bold text-[#1C5E35]">C · Habilidades Transversales (20%)</h3>
		<SliderEval label="7. Comunicación y expresión" description="Se expresa con claridad, argumenta, escucha activamente." bind:value={v7} name="comunicacion_expresion" />
		<SliderEval label="8. Actitud, motivación y adaptación" description="Motivación, adaptación al entorno universitario, iniciativa." bind:value={v8} name="actitud_motivacion" />

		<!-- Hidden inputs para enviar valores -->
		<input type="hidden" name="asistencia_puntualidad" value={v1} />
		<input type="hidden" name="participacion_compromiso" value={v2} />
		<input type="hidden" name="responsabilidad_cumplimiento" value={v3} />
		<input type="hidden" name="disciplina_normas" value={v4} />
		<input type="hidden" name="respeto_convivencia" value={v5} />
		<input type="hidden" name="trabajo_colaborativo" value={v6} />
		<input type="hidden" name="comunicacion_expresion" value={v7} />
		<input type="hidden" name="actitud_motivacion" value={v8} />

		<div class="rounded-xl border bg-white p-4">
			<label class="text-sm font-semibold">Observaciones (opcional, 500 chars)</label>
			<textarea name="observaciones" rows="3" maxlength="500" class="mt-2 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Comentarios extra sobre el alumno...">{data.existing?.observaciones || ''}</textarea>
			<p class="mt-1 text-xs text-zinc-400">No afecta promedio. Se alerta si promedio &lt;3 o alguna variable =1.</p>
		</div>

		<button class="w-full rounded-xl bg-[#7D2323] py-3 font-bold text-white hover:bg-[#631C1C]">Guardar evaluación</button>
	</form>
</div>

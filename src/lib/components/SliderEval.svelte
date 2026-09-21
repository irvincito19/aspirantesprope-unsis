<script lang="ts">
	let {
		label,
		description,
		value = $bindable(3),
		name
	}: { label: string; description: string; value: number; name: string } = $props();

	const labels: Record<number, string> = {
		1: 'Deficiente',
		2: 'Básico',
		3: 'Aceptable',
		4: 'Bueno',
		5: 'Excelente'
	};
</script>

<div class="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
	<div class="mb-1 flex items-center justify-between">
		<label for={name} class="text-sm font-semibold text-[#231F20]">{label}</label>
		<span class="rounded-full bg-[#FBE9E9] px-3 py-1 text-xs font-bold text-[#7D2323]">{value} · {labels[value]}</span>
	</div>
	<p class="mb-3 text-xs text-zinc-500">{description}</p>
	<input
		id={name}
		name={name}
		type="range"
		min="1"
		max="5"
		step="1"
		bind:value
		class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#FBE9E9] accent-[#7D2323]"
	/>
	<div class="mt-1 flex justify-between text-[10px] text-zinc-400">
		<span>1 Nunca</span><span>3 A veces</span><span>5 Siempre</span>
	</div>
</div>

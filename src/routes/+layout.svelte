<script>
	import { Struct } from 'drizzle-struct/front-end';
	import { browser } from '$app/environment';
	import MainNav from '$lib/components/general/MainNav.svelte';
	import Footer from '$lib/components/general/Footer.svelte';

	setTimeout(() => {
		if (browser) Struct.buildAll();
	});
	const { children } = $props();
</script>

<main>
	<MainNav />
	{@render children()}
	<Footer />
</main>

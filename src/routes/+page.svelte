<script lang="ts">
	import { Form } from '$lib/utils/form';
	import { onMount } from 'svelte';

	const onresize = () => {
		document.querySelectorAll('.height-container').forEach((el) => {
			let maxHeight = 0;
			const els = el.querySelectorAll('.same-height');
			els.forEach((el) => {
				maxHeight = Math.max(maxHeight, el.clientHeight);
			});

			els.forEach((el) => {
				el.setAttribute('style', `height: ${maxHeight}px`);
			});
		});
	};

	onMount(() => {
		onresize();

		window.addEventListener('resize', onresize);

		return () => {
			window.removeEventListener('resize', onresize);
		};
	});
</script>

<div class="container">
	<div class="row my-3 layer-1">
		<div class="col pb-3">
			<h1 class="text-center">Elevate TV</h1>
			<h5 class="text-muted">AI-driven prdictive scene switching for live streaming</h5>
			<hr />
			<button
				type="button"
				class="btn btn-secondary"
				onclick={() => {
					new Form('?/join-mailer')
						.input('name', {
							type: 'text',
							disabled: false,
							label: 'Name',
							value: '',
							placeholder: 'Enter your name',
							required: true
						})
						.input('email', {
							type: 'email',
							disabled: false,
							label: 'Email',
							value: '',
							placeholder: 'Enter your email',
							required: true
						})
						.prompt({
							title: 'Join Our Mailing List',
							send: true
						});
				}}
			>
				Stay Updated
			</button>
		</div>
	</div>
	<div class="row mb-3 layer-1">
		<div class="col">
			<h2>Our Mission</h2>
		</div>
	</div>
	<div class="row mb-3 layer-1 pb-5 height-container">
		<div class="col-12 mb-3">
			<h2>Core Values</h2>
		</div>
		<div class="col-md-4">
			<div class="card layer-2 same-height">
				<div class="card-body">
					<h5 class="card-title">Innovation</h5>
					<p class="text-small text-muted">
						We are constantly pushing the boundaries of what is possible.
					</p>
				</div>
			</div>
		</div>
		<div class="col-md-4">
			<div class="card layer-2 same-height">
				<div class="card-body">
					<h5 class="card-title">Choice</h5>
					<p class="text-small text-muted">
						We believe in giving our users the ability to have control over their experience.
					</p>
				</div>
			</div>
		</div>
		<div class="col-md-4">
			<div class="card layer-2 same-height">
				<div class="card-body">
					<h5 class="card-title">User Experience</h5>
					<p class="text-small text-muted">
						We are dedicated to providing the best user experience through seameless integration.
					</p>
				</div>
			</div>
		</div>
	</div>
	<div class="row mb-3 layer-1 pb-5 height-container">
		<div class="col-12 mb-3">
			<h2>What's Coming</h2>
		</div>
		<div class="col-md-4 h-100">
			<div class="card layer-2 same-height">
				<div class="card-body">
					<h5 class="card-title">WebRTC Streaming</h5>
					<p class="text-small text-muted">
						Real-time, low-latency, easy to integrate streaming technology.
					</p>
				</div>
			</div>
		</div>
		<div class="col-md-4">
			<div class="card layer-2 same-height">
				<div class="card-body">
					<h5 class="card-title">AI Player Switching</h5>
					<p class="text-small text-muted">
						Never miss the action. Automated scene switching between players and/or teams.
					</p>
				</div>
			</div>
		</div>
		<div class="col-md-4">
			<div class="card layer-2 same-height">
				<div class="card-body">
					<h5 class="card-title">Interactive Experience</h5>
					<p class="text-small text-muted">
						Engage with your favorite streamers like never before. Pick your favorite player/team
						and never miss a good moment.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>

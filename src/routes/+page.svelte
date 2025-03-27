<script lang="ts">
	import { Form } from "$lib/utils/form";
</script>

<div class="container">
	<div class="row">
		<div class="col">
			<h1>Elevate.TV</h1>
			<small class="text-muted">
				AI-driven prdictive scene switching for live streaming
			</small>
			<button type="button" class="btn btn-primary"
				onclick={() => {
					new Form('?/join-mailer')
						.input('name', {
							type: 'text',
							disabled: false,
							label: 'Name',
							value: '',
							placeholder: 'Enter your name',
							required: true,
						})
						.input('email',{
							type: 'email',
							disabled: false,
							label: 'Email',
							value: '',
							placeholder: 'Enter your email',
							required: true,
						})
						.prompt({
							title: 'Join Our Mailing List',
							send: true,
						});
				}}
			>
				Stay Updated
			</button>
		</div>
	</div>
</div>
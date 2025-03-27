<script lang="ts">
	import { PUBLIC_APP_NAME } from '$env/static/public';
</script>

<nav class="navbar navbar-expand-lg layer-1">
	<div class="container-fluid">
		<a class="navbar-brand" href="/">{PUBLIC_APP_NAME}</a>
		<button
			class="navbar-toggler"
			type="button"
			data-bs-toggle="collapse"
			data-bs-target="#navbarSupportedContent"
			aria-controls="navbarSupportedContent"
			aria-expanded="false"
			aria-label="Toggle navigation"
		>
			<span class="navbar-toggler-icon"></span>
		</button>
		<div class="collapse navbar-collapse" id="navbarSupportedContent">
			<ul class="navbar-nav me-auto mb-2 mb-lg-0">
				<li class="nav-item">
					<a class="nav-link active" aria-current="page" href="/">Home</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="/about-us">About Us</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="/our-plans">Our Plans</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="/contact">Contact</a>
				</li>
			</ul>
			<!-- <form class="d-flex" role="search">
          <input class="form-control me-2" type="search" placeholder="Search" aria-label="Search">
          <button class="btn btn-outline-success" type="submit">Search</button>
        </form> -->
		</div>
	</div>
</nav>

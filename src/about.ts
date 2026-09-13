export function aboutPage(): Response {
	return new Response(`<!doctype html>
<html lang="id">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width,initial-scale=1">
	<title>Tentang AI Mr Ferdy</title>
	<meta name="description" content="Tentang AI Mr Ferdy, asisten AI untuk berbagai kebutuhan digital.">
</head>
<body>
	<main>
		<h1>Tentang AI Mr Ferdy</h1>
		<p>AI Mr Ferdy adalah asisten AI yang dirancang untuk membantu berbagai kebutuhan digital.</p>
		<p><a href="/">Kembali ke Chat</a></p>
	</main>
</body>
</html>`, {
		headers: {
			"content-type": "text/html; charset=UTF-8",
		},
	});
}

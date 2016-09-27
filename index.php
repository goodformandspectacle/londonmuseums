<?php

// ID of the Google spreadsheet that's been
// 'Published to the web' (in File menu):

// Full list of museums:
//$SPREADSHEET_KEY = '1CdjUEEeZR4Rc9B39_LQnUhWZzfnyQaxdgfQTwW3P18w';

// GF&S Visits:
$SPREADSHEET_KEY = '1DmS5tLWa6Gv3dfowFxye6MyvPQxjrKXjxlBjqpG7pJk';

$PAGE_TITLE = 'Good, Form &amp; Spectacle Museum Visits';

?><!doctype html>
<html class="no-js" lang="en-gb">
	<head>
		<meta charset="utf-8">
		<meta http-equiv="x-ua-compatible" content="ie=edge">
		<title><?php echo $PAGE_TITLE; ?></title>
		<script>
			document.documentElement.className = document.documentElement.className.replace(/\bno-js\b/g, '') + 'js';
		</script>
		<meta name="description" content="">
		<meta name="viewport" content="width=device-width, initial-scale=1">

		<link rel="stylesheet" href="css/normalize.css">
		<link rel="stylesheet" href="css/main.css">
	</head>
	<body>
		<div class="container">
			<h1><?php echo $PAGE_TITLE; ?></h1>

			<p>Some intro text here.</p>

			<noscript>
				<p>This page requires JavaScript to work properly.</p>

				<p>You can view the data in <a href="https://docs.google.com/spreadsheets/d/<?php echo $SPREADSHEET_KEY; ?>/pubhtml">this Google spreadsheet</a>, although that will probably require JavaScript too.</p>
			</noscript>

			<p class="table-filter">
				<label>
					Filter list:
					<input id="js-museums-table-filter" type="text">
				</label>
			</p>

			<p class="js-loading loading">Loading data…</p>

			<div id="js-museums-table" class="table-responsive"></div>
		</div>

		<script id="js-museums-table_template" type="text/html">
			<table>
				<thead>
					<tr>
						<th class="tHeader">Name</th>
						<th class="tHeader">Date visited</th>
					</tr>
				</thead>
				<tbody>
				{{#rows}}
					<tr>
						<td>{{name}}</td>
						<td class="td-date">{{datevisited}}</td>
					</tr>
				{{/rows}}
				</tbody>
			</table>
		</script>

		<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js"></script>
		<script>window.jQuery || document.write('<script src="js/vendor/jquery.min.js"><\/script>')</script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/tabletop.js/1.3.4/tabletop.min.js"></script>
		<script src="js/vendor/sheetsee.js"></script>
		<script src="js/main.js"></script>

		<script>
			$(document).ready(function() {
				visits.init({
					'spreadsheet': '<?php echo $SPREADSHEET_KEY; ?>'
				});
			});
		</script>
	</body>
</html>

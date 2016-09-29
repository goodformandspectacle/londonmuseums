<?php

// ID of the Google spreadsheet that's been
// 'Published to the web' (in File menu):

// Full list of museums:
//$SPREADSHEET_KEY = '1CdjUEEeZR4Rc9B39_LQnUhWZzfnyQaxdgfQTwW3P18w';

// GF&S Visits:
$SPREADSHEET_KEY = '1DmS5tLWa6Gv3dfowFxye6MyvPQxjrKXjxlBjqpG7pJk';

$MAPBOX_TOKEN = 'pk.eyJ1IjoiZ29vZGZvcm1hbmQiLCJhIjoiY2l0bzRxenA3MDAwMDJ0bGJwNHQzc2xyZiJ9.xU7FeiKjxxF33_0ppsG-Mg';

$PAGE_TITLE = 'Good, Form & Spectacle Museum Visits';

$URL_ROOT = '/';

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

		<link rel="stylesheet" href="https://unpkg.com/leaflet@1.0.0-rc.3/dist/leaflet.css">
		<link rel="stylesheet" href="<?php echo $URL_ROOT; ?>css/normalize.css">
		<link rel="stylesheet" href="<?php echo $URL_ROOT; ?>css/main.css">
	</head>
	<body>
		<div class="container">
			<h1><?php echo $PAGE_TITLE; ?></h1>

			<p>Some intro text here.</p>

			<noscript>
				<p>This page requires JavaScript to work properly.</p>

				<p>You can view the data in <a href="https://docs.google.com/spreadsheets/d/<?php echo $SPREADSHEET_KEY; ?>/pubhtml">this Google spreadsheet</a>, although that will probably require JavaScript too.</p>
			</noscript>

			<div id="js-visit-detail" class="visit-detail"></div>

			<div id="js-visit-map" class="visit-map"></div>

			<p class="table-filter">
				<label>
					Filter list:
					<input id="js-visits-table-filter" type="text">
				</label>
			</p>

			<p class="js-loading loading">Loading data…</p>

			<div id="js-visits-table" class="table-responsive"></div>
		</div>

		<script id="js-visits-table_template" type="text/html">
			<table>
				<thead>
					<tr>
						<th class="tHeader" title="Click to reorder">
							Name
						</th>
						<th class="tHeader td-date" title="Click to reorder">
							Date visited
						</th>
					</tr>
				</thead>
				<tbody>
				{{#rows}}
					<tr class="js-visit-{{ visitid }}">
						<td>
							<a class="js-museum-link" href="visit/{{ visitid }}">{{name}}</a>
						</td>
						<td class="td-date">{{datevisited}}</td>
					</tr>
				{{/rows}}
				</tbody>
			</table>
		</script>

		<script id="js-visit-detail_template" type="text/html">
			<h2>{{name}}</h2>
			<dl class="dl-horizontal">
				{{#datevisited}}
					<dt>Date visited</dt>
					<dd>{{ datevisited }}</dd>
				{{/datevisited}}
				{{#immediatenotes}}
					<dt>Notes</dt>
					<dd>{{ immediatenotes }}</dd>
				{{/immediatenotes}}

				{{#hasaddress}}
					<dt>Address</dt>
					<dd>
						{{#address}}
							{{ address }}<br>
						{{/address}}
						{{#city}}
							{{ city }}
						{{/city}}
						{{#postcode }}
							{{ postcode }}
						{{/postcode }}
					</dd>
				{{/hasaddress}}

				{{#admissioncost}}
					<dt>Admission cost</dt>
					<dd>{{ admissioncost }}</dd>
				{{/admissioncost}}

				{{#yearfounded}}
					<dt>Founded</dt>
					<dd>{{ yearfounded }}</dd>
				{{/yearfounded}}
				{{#yearbuilt}}
					<dt>Built</dt>
					<dd>{{ yearbuilt }}</dd>
				{{/yearbuilt}}
				{{#yearopened}}
					<dt>Opened</dt>
					<dd>{{ yearopened }}</dd>
				{{/yearopened}}

				{{#directorgender}}
					<dt>Director gender</dt>
					<dd>{{ directorgender}}</dd>
				{{/directorgender}}
				{{#objects}}
					<dt>Number of objects</dt>
					<dd>{{ objects }}</dd>
				{{/objects}}

				{{#hasurl}}
					<dt>Elsewhere</dt>
					<dd>
						<ul>
							{{#url}}
								<li><a href="{{ url }}">Museum’s own site</a></li>
							{{/url}}
							{{#wikipediaurl}}
								<li><a href="{{ wikipediaurl }}">Wikipedia</a></li>
							{{/wikipediaurl}}
							{{#gfsblogpost}}
								<li><a href="{{ gfsblogpost }}">GF&amp;S blog post</a></li>
							{{/gfsblogpost}}
						</ul>
					</dd>
				{{/hasurl}}
			</dl>
		</script>

		<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js"></script>
		<script>window.jQuery || document.write('<script src="<?php echo $URL_ROOT; ?>js/vendor/jquery.min.js"><\/script>')</script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/tabletop.js/1.3.4/tabletop.min.js"></script>
		<script src="https://unpkg.com/leaflet@1.0.0-rc.3/dist/leaflet.js"></script>
		<script src="<?php echo $URL_ROOT; ?>js/vendor/sheetsee.js"></script>
		<script src="<?php echo $URL_ROOT; ?>js/vendor/jquery.history.js"></script>
		<script src="<?php echo $URL_ROOT; ?>js/main.js"></script>

		<script>
			$(document).ready(function() {
				visits.init({
					'spreadsheet': '<?php echo $SPREADSHEET_KEY; ?>',
					'mapboxToken': '<?php echo $MAPBOX_TOKEN; ?>',
					'urlRoot': '<?php echo $URL_ROOT; ?>',
					'siteTitle': '<?php echo $PAGE_TITLE; ?>'
				});
			});
		</script>
	</body>
</html>

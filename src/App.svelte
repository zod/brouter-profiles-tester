<script>
	import { TESTS } from './tests'
	import _ from 'lodash';
	import L from 'leaflet';
	import 'leaflet/dist/leaflet.css';

	let test_profile = "";
	let reference_profile = "trekking";
	let brouter_url = "http://brouter.de:7777";
	let brouter_web_url = "http://brouter.de/brouter-web/";
	let tile_url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

	let tests = TESTS;

	let errorMessage = ''
	let statusMessage = ''

	function getTestCategoryId(testCategory) {
		return testCategory.replace(/[^a-zA-Z]/g, "");
	}

	function brouter_request_url(startPoint, endPoint, profile) {
		return brouter_url + '/brouter?' +
		'lonlats=' + startPoint.join(',') + '|' + endPoint.join(',') + '&' +
		'profile=' + profile + '&' +
		'alternativeidx=0&format=geojson'
	}

	function brouter_web_debug_url(testCase) {
		return brouter_web_url + '/#map=15/' + testCase.start_point[1] + '/' + testCase.start_point[0] +
			'/osm&' + 'lonlats=' + testCase.start_point.join(',') + '|' + testCase.end_point.join(',') +
			'&' + 'profile=' + reference_profile
	}

	async function runTests() {
		errorMessage = ''
		statusMessage = 'Running tests'
		let test_profile_id;
		await fetch(
			brouter_url + '/brouter/profile', {
				method: 'POST',
				mode: 'cors',
				body: test_profile
			})
		.then(response => response.json())
		.then(response => {
			if (response['error']) {
				throw response['error']
			}
			test_profile_id = response['profileid']
		})
		.catch(error => {
			statusMessage = ''
			errorMessage = error
		})

		if (!test_profile_id) {
			return;
		}

		var promisesQueue = Promise.resolve(null);
		Object.entries(tests).forEach(([testCategory, testCases]) => {
			testCases.forEach((testCase) => {
				promisesQueue = promisesQueue.then(() => {
					return new Promise((resolve, reject) => {
						fetch(
							brouter_request_url(testCase.start_point, testCase.end_point, test_profile_id), {
								mode: 'cors'
							})
							.then(response => response.json())
							.then(geojson => {
								testCase.expected = geojson
								fetch(
									brouter_request_url(testCase.start_point, testCase.end_point, reference_profile), {
										mode: 'cors'
									})
								.then(response => response.json())
								.then(geojson => {
									testCase.actual = geojson
									resolve(null)
								})
							})
							.catch(error => {
								errorMessage = 'see test results below.'
								testCase.errorMsg = error
								reject(null)
							})
					})
				})
			});
		});
		promisesQueue
		.then(() => statusMessage = 'All tests done, see individual results below!')
		.catch(error => {
			statusMessage = ''
			errorMessage = error
		})
		.then(() => tests = tests)
	}

	function mapAction(container, testCase) {
		let startPoint = testCase.start_point;
		let endPoint = testCase.end_point;
		let map = L.map(container);
		L.tileLayer(tile_url, {
			attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
			minZoom: 0,
			maxZoom: 19,
		}).addTo(map)
		map.fitBounds(L.latLngBounds(
			L.latLng(Math.min(startPoint[1], endPoint[1]), Math.min(startPoint[0], endPoint[0])),
			L.latLng(Math.max(startPoint[1], endPoint[1]), Math.max(startPoint[0], endPoint[0]))
		));
		if (testCase.human) {
			L.geoJSON(testCase.human, { style: { color: '#5CA423' } }).addTo(map);
		}
		return {
			update: () => {
				if (testCase.expected) {
					L.geoJSON(testCase.expected).addTo(map);
				}
				if (testCase.actual) {
					L.geoJson(testCase.actual, { style: { color: '#666666' } }).addTo(map);
				}
			},
			destroy: () => {
				map.remove();
			},
		};
	}
</script>

<main>
	<h1 id="brouter-tester">BRouter profiles tester</h1>
	<p>Here are some test cases to check <a href="http://brouter.de/">BRouter</a> profiles and help with development of new profiles.</p>

	<p><strong>Important: beware that the map tiles used are the live map tiles (using up to date OSM data) contrary to the BRouter <code>segments4</code> test files which are using a fixed dump of OSM data. Then, the map background may come out of sync with the data used by BRouter and are only there as an eyeguide.</strong></p>

	<p>The map show the route computed with the selected profile (in blue), the route computed by the reference profile (in grey) as well as a route computed by a human (in green). Note that the human route is not necessarily the best one or the unique valid solution.</p>

	<p>The tests assume the BRouter instance uses <a href="https://pub.phyks.me/brouter-testing/segments4/">these <code>segments4</code> files</a> which are built from the <a href="https://download.geofabrik.de/">Geofabrik.de</a> extracts of metropolitan France, New York state (US) and Sachsen state (Germany) from the 10th of November, 2018. The <code>profiles2</code> folder used to build the <code>segments4</code> files is available <a href="https://pub.phyks.me/brouter-testing/profiles2/">here</a> (including the <code>lookups.dat</code> file). The SRTM data used to build the <code>segments4</code> are available <a href="https://pub.phyks.me/brouter-testing/srtm/">here</a>.</p>


	<h2>Settings</h2>
	<form id="settings" on:submit|preventDefault={runTests}>
		<p>
			<label for="profile">Profile content: </label>
			<textarea name="profile" id="profile" bind:value={test_profile} ></textarea>
		</p>
		<p>
			<label for="reference-profile">Reference profile: </label>
			<input type="text" name="reference_profile" id="reference-profile" bind:value={reference_profile} />
		</p>
		<p>
			<label for="brouter-url">BRouter URL: </label>
			<input type="text" name="brouter_url" id="brouter-url" bind:value={brouter_url} />
			<span class="footnote">Your BRouter instance should provide <a href="https://developer.mozilla.org/fr/docs/Web/HTTP/CORS">CORS</a> headers. Otherwise, you can use an extension such as <a href="https://addons.mozilla.org/fr/firefox/addon/cors-everywhere/">CORS Everywhere</a>.</span>
		</p>
		<p>
			<label for="brouter-web-url">BRouter web URL (for debug): </label>
			<input type="text" name="brouter_web_url" id="brouter-web-url" bind:value={brouter_web_url} />
		</p>
		<p>
			<label for="tile-url">Tile URL: </label>
			<input type="text" name="tile_url" id="tile-url" bind:value={tile_url} />
		</p>

		{#if errorMessage}
			<p class="error" id="error">ERROR: {errorMessage}</p>
		{/if}
		{#if statusMessage}
			<p id="status">{statusMessage}</p>
		{/if}
		<button class="center" type="submit">Run tests</button>
	</form>

	<h2>Summary</h2>
	{#each Object.entries(tests) as [ testCategory, testCases ] }
		<div class="summary">
		<h3><a href="#{getTestCategoryId(testCategory)}">{testCategory}</a></h3>
		<ul>
		{#each testCases as testCase, testCaseIndex }
			<li><a href="#{getTestCategoryId(testCategory) + testCaseIndex}">{testCase.description}</a></li>
		{/each}
		</ul>
		</div>
	{/each}

	{#each Object.entries(tests) as [ testCategory, testCases ] }
		<h2 id="{getTestCategoryId(testCategory)}">{testCategory}</h2>
		{#each testCases as testCase, testCaseIndex }
		<div class="testcase">
			<p class="description" id="{getTestCategoryId(testCategory) + testCaseIndex}">{testCase.description}</p>
			{#if testCase.errorMsg}
				<p class="error">ERROR: {testCase.errorMsg}</p>
			{/if}
			<div class="map" use:mapAction={testCase}/>
			<div class="footer">
				<p class="debug"><a href="{brouter_web_debug_url(testCase)}" target="_blank">Debug this test case</a></p>
				<p class="back-top"><a href="#brouter-tester">Back to top ↑</a></p>
			</div>
		</div>
		{/each}
	{/each}
</main>

<style>
</style>
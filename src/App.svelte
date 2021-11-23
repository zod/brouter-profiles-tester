<script>
  import { runTestSuite } from "./test-runner";
  import TESTS from "./tests.json";

  import _ from "lodash";
  import L from "leaflet";
  import "leaflet/dist/leaflet.css";
  import "bootstrap";
  import "bootstrap/dist/css/bootstrap.min.css";

  let test_profile = "";
  let reference_profile = "trekking";
  let brouter_url = "http://brouter.de:7777";
  let brouter_web_url = "http://brouter.de/brouter-web/";
  let tile_url =
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";

  let testSuite = _.cloneDeep(TESTS);

  let fileInput;

  let errorMessage = "";
  let statusMessage = "";

  function runTests() {
    errorMessage = "";

    let testConfig = {
      brouterUri: brouter_url,
      profiles: {
        expected: reference_profile,
        actual: test_profile,
      },
    };

    runTestSuite(testSuite, testConfig)
      .then((testSuiteResult) => {
        testSuite = testSuiteResult;
      })
      .catch((error) => (errorMessage = error));
  }

  function importTests(event) {
    let testCasesImport = event.target.files;
    for (let i = 0, numFiles = testCasesImport.length; i < numFiles; i++) {
      const file = testCasesImport[i];
      file.text().then((json) => {
        var geojson = JSON.parse(json);
        var feature = geojson.features[0];
        var name = feature.properties.name;
        var start = feature.geometry.coordinates[0];
        var end =
          feature.geometry.coordinates[feature.geometry.coordinates.length - 1];
        testSuite.push({
          description: name,
          start_point: start,
          end_point: end,
          human: geojson,
        });
        console.log(testSuite);
        testSuite = testSuite;
      });
    }
  }

  function exportTests(event) {
    event.target.href = URL.createObjectURL(
      new Blob([JSON.stringify(testSuite, null, 2)], {
        type: "application/json",
      })
    );
  }

  function resetTests() {
    testSuite = _.cloneDeep(TESTS);
  }

  function brouterWebDebugUrl(testCase) {
    return (
      brouter_web_url +
      "/#map=15/" +
      testCase.start_point[1] +
      "/" +
      testCase.start_point[0] +
      "/osm&" +
      "lonlats=" +
      testCase.start_point.join(",") +
      "|" +
      testCase.end_point.join(",") +
      "&" +
      "profile=" +
      reference_profile
    );
  }

  function mapAction(container, testCase) {
    let startPoint = testCase.start_point;
    let endPoint = testCase.end_point;
    let map = L.map(container);
    L.tileLayer(tile_url, {
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
      minZoom: 0,
      maxZoom: 20,
      subdomains: "abcd",
    }).addTo(map);
    map.fitBounds(
      L.latLngBounds(
        L.latLng(
          Math.min(startPoint[1], endPoint[1]),
          Math.min(startPoint[0], endPoint[0])
        ),
        L.latLng(
          Math.max(startPoint[1], endPoint[1]),
          Math.max(startPoint[0], endPoint[0])
        )
      )
    );
    if (testCase.human) {
      L.geoJSON(testCase.human, { style: { color: "#5CA423" } }).addTo(map);
    }
    return {
      update: () => {
        if (testCase.testResult && testCase.testResult.expected) {
          L.geoJSON(testCase.testResult.expected.geoJSON).addTo(map);
        }
        if (testCase.testResult && testCase.testResult.actual) {
          L.geoJson(testCase.testResult.actual.geoJSON, {
            style: { color: "#666666" },
          }).addTo(map);
        }
      },
      destroy: () => {
        map.remove();
      },
    };
  }
</script>

<main>
  <div class="container-fluid">
    <h1 id="brouter-tester" class="display-1">BRouter profiles tester</h1>
    <div class="row">
      <div class="col-lg-4">
        <h2>Settings</h2>
        <form id="settings">
          <div class="mb-3">
            <label for="profile" class="form-label">Profile content</label>
            <textarea
              class="form-control"
              bind:value={test_profile}
            />
          </div>
          <div class="mb-3">
            <label for="reference-profile">Reference profile: </label>
            <input
              type="text"
              class="form-control"
              bind:value={reference_profile}
            />
          </div>
          <div class="mb-3">
            <label for="brouter-url" class="form-label">BRouter URL</label>
            <input type="text" class="form-control" bind:value={brouter_url} />
            <div class="form-text">
              Use a BRouter instance which provides HTTPS if this site is served
              using HTTPS
            </div>
          </div>
          <div class="mb-3">
            <label for="brouter-web-url" class="form-label"
              >BRouter web URL (for debug)</label
            >
            <input
              type="text"
              class="form-control"
              bind:value={brouter_web_url}
            />
          </div>
          <div class="mb-3">
            <label for="tile-url" class="form-label">Tile URL</label>
            <input type="text" class="form-control" bind:value={tile_url} />
          </div>

          {#if errorMessage}
            <p class="error" id="error">ERROR: {errorMessage}</p>
          {/if}
          {#if statusMessage}
            <p id="status">{statusMessage}</p>
          {/if}
        </form>
      </div>
      <div class="col-lg-4">
        <h2>Tests</h2>
        <div class="btn-group" role="toolbar" aria-label="Test actions">
          <button type="button" class="btn btn-primary" on:click={runTests}
            >Run</button
          >
          <button
            type="button"
            class="btn btn-secondary"
            on:click={() => {
              fileInput.click();
            }}>Import</button
          >
          <input
            bind:this={fileInput}
            type="file"
            style="display: none"
            accept=".geojson"
            multiple
            on:change={importTests}
          />
          <!-- svelte-ignore a11y-missing-attribute -->
          <a
            type="button"
            class="btn btn-secondary"
            download="tests.json"
            on:click={exportTests}>Export</a
          >
          <button type="button" class="btn btn-secondary" on:click={resetTests}
            >Reset</button
          >
        </div>
        <div class="summary">
          <ul>
            {#each testSuite as testCase, testCaseIndex}
              <li>
                <a href={"#testcase-" + testCaseIndex}>{testCase.description}</a
                >
              </li>
            {/each}
          </ul>
        </div>
      </div>
      <div class="col-lg-4">
        <h2>Results</h2>

        {#each testSuite as testCase, testCaseIndex}
          <div class="testcase">
            <p class="description" id={"testcase-" + testCaseIndex}>
              {testCase.description}
            </p>
            {#if testCase.testResult && testCase.testResult.error && testCase.testResult.error()}
              <p class="error">ERROR: {testCase.testResult.error()}</p>
            {/if}
            <div class="map" use:mapAction={testCase} />
            <div class="footer">
              <p class="debug">
                <a href={brouterWebDebugUrl(testCase)} target="_blank"
                  >Debug this test case</a
                >
              </p>
              <p class="back-top">
                <a href="#brouter-tester">Back to top ↑</a>
              </p>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</main>

<style>
  textarea {
    min-height: 300px;
  }
  .map {
    height: 300px;
  }

  .footer {
    font-size: 0.8em;
    display: flex;
  }

  .debug {
    flex: auto;
    text-align: left;
  }

  .back-top {
    flex: auto;
    text-align: right;
  }

  .error {
    font-weight: bold;
    color: red;
  }
</style>

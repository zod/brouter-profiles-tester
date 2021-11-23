<script>
  import { TESTS } from "./tests";
  import _ from "lodash";
  import L from "leaflet";
  import "leaflet/dist/leaflet.css";
  import "bootstrap";
  import "bootstrap/dist/css/bootstrap.min.css";

  let test_profile = "";
  let reference_profile = "trekking";
  let brouter_url = "http://brouter.de:7777";
  let brouter_web_url = "http://brouter.de/brouter-web/";
  let tile_url = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png";

  let tests = TESTS;

  let errorMessage = "";
  let statusMessage = "";

  function getTestCategoryId(testCategory) {
    return testCategory.replace(/[^a-zA-Z]/g, "");
  }

  function brouter_request_url(startPoint, endPoint, profile) {
    return (
      brouter_url +
      "/brouter?" +
      "lonlats=" +
      startPoint.join(",") +
      "|" +
      endPoint.join(",") +
      "&" +
      "profile=" +
      profile +
      "&" +
      "alternativeidx=0&format=geojson"
    );
  }

  function brouter_web_debug_url(testCase) {
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

  async function runTests() {
    errorMessage = "";
    statusMessage = "Running tests";
    let test_profile_id;
    await fetch(brouter_url + "/brouter/profile", {
      method: "POST",
      mode: "cors",
      body: test_profile,
    })
      .then((response) => response.json())
      .then((response) => {
        if (response["error"]) {
          throw response["error"];
        }
        test_profile_id = response["profileid"];
      })
      .catch((error) => {
        statusMessage = "";
        errorMessage = error;
      });

    if (!test_profile_id) {
      return;
    }

    var promisesQueue = Promise.resolve(null);
    Object.entries(tests).forEach(([testCategory, testCases]) => {
      testCases.forEach((testCase) => {
        promisesQueue = promisesQueue.then(() => {
          return new Promise((resolve, reject) => {
            fetch(
              brouter_request_url(
                testCase.start_point,
                testCase.end_point,
                test_profile_id
              ),
              {
                mode: "cors",
              }
            )
              .then((response) => response.json())
              .then((geojson) => {
                testCase.expected = geojson;
                fetch(
                  brouter_request_url(
                    testCase.start_point,
                    testCase.end_point,
                    reference_profile
                  ),
                  {
                    mode: "cors",
                  }
                )
                  .then((response) => response.json())
                  .then((geojson) => {
                    testCase.actual = geojson;
                    resolve(null);
                  });
              })
              .catch((error) => {
                errorMessage = "see test results below.";
                testCase.errorMsg = error;
                reject(null);
              });
          });
        });
      });
    });
    promisesQueue
      .then(
        () => (statusMessage = "All tests done, see individual results below!")
      )
      .catch((error) => {
        statusMessage = "";
        errorMessage = error;
      })
      .then(() => (tests = tests));
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
        if (testCase.expected) {
          L.geoJSON(testCase.expected).addTo(map);
        }
        if (testCase.actual) {
          L.geoJson(testCase.actual, { style: { color: "#666666" } }).addTo(
            map
          );
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
        <form id="settings" on:submit|preventDefault={runTests}>
          <div class="mb-3">
            <label for="profile" class="form-label">Profile content</label>
            <textarea
              class="form-control"
              name="profile"
              id="profile"
              bind:value={test_profile}
            />
          </div>
          <div class="mb-3">
            <label for="reference-profile">Reference profile: </label>
            <input
              type="text"
              class="form-control"
              name="reference_profile"
              id="reference-profile"
              bind:value={reference_profile}
            />
          </div>
          <div class="mb-3">
            <label for="brouter-url" class="form-label">BRouter URL</label>
            <input
              type="text"
              class="form-control"
              name="brouter_url"
              id="brouter-url"
              bind:value={brouter_url}
            />
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
              name="brouter_web_url"
              id="brouter-web-url"
              bind:value={brouter_web_url}
            />
          </div>
          <div class="mb-3">
            <label for="tile-url" class="form-label">Tile URL</label>
            <input
              type="text"
              class="form-control"
              name="tile_url"
              id="tile-url"
              bind:value={tile_url}
            />
          </div>

          {#if errorMessage}
            <p class="error" id="error">ERROR: {errorMessage}</p>
          {/if}
          {#if statusMessage}
            <p id="status">{statusMessage}</p>
          {/if}
          <button class="btn btn-primary" type="submit">Run tests</button>
        </form>
      </div>
      <div class="col-lg-4">
        <h2>Tests</h2>
        {#each Object.entries(tests) as [testCategory, testCases]}
          <div class="summary">
            <h3>
              <a href="#{getTestCategoryId(testCategory)}">{testCategory}</a>
            </h3>
            <ul>
              {#each testCases as testCase, testCaseIndex}
                <li>
                  <a href="#{getTestCategoryId(testCategory) + testCaseIndex}"
                    >{testCase.description}</a
                  >
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>
      <div class="col-lg-4">
        <h2>Results</h2>
        {#each Object.entries(tests) as [testCategory, testCases]}
          <h3 id={getTestCategoryId(testCategory)}>{testCategory}</h3>
          {#each testCases as testCase, testCaseIndex}
            <div class="testcase">
              <p
                class="description"
                id={getTestCategoryId(testCategory) + testCaseIndex}
              >
                {testCase.description}
              </p>
              {#if testCase.errorMsg}
                <p class="error">ERROR: {testCase.errorMsg}</p>
              {/if}
              <div class="map" use:mapAction={testCase} />
              <div class="footer">
                <p class="debug">
                  <a href={brouter_web_debug_url(testCase)} target="_blank"
                    >Debug this test case</a
                  >
                </p>
                <p class="back-top">
                  <a href="#brouter-tester">Back to top ↑</a>
                </p>
              </div>
            </div>
          {/each}
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
</style>

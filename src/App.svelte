<script>
  import { runTestSuite } from "./test-runner";
  import TESTS from "./tests.json";

  import TestResults from "./TestResults.svelte";
  import TestSettings from "./TestSettings.svelte";

  import _ from "lodash";
  import {
    Button,
    ButtonGroup,
    Col,
    Container,
    Row,
    Spinner,
    Styles,
  } from "sveltestrap";

  function parseProfileParam(paramValue, profile, defaultValue) {
    if (paramValue?.startsWith("http")) {
      profile.url = paramValue;
    } else {
      profile.name = paramValue || defaultValue;
    }
  }

  let testSettings = {};
  let testProfile = {};
  let referenceProfile = {};
  let brouterUrl = "https://brouter.de";
  let brouterWebUrl = "https://brouter.de/brouter-web";
  let tileUrl =
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";

  let testSuite = _.cloneDeep(TESTS);

  let urlParams = new URLSearchParams(window.location.search);

  parseProfileParam(urlParams.get("testProfile"), testProfile);
  parseProfileParam(
    urlParams.get("referenceProfile"),
    referenceProfile,
    "trekking"
  );

  if (urlParams.has("testsuite")) {
    fetch(urlParams.get("testsuite"))
      .then((response) => response.json())
      .then((data) => (testSuite = data));
  }

  let fileInput;

  let errorMessage = "";
  let statusMessage = "";

  let testsInProgress = false;

  async function runTests() {
    testsInProgress = true;
    errorMessage = "";

    await testSettings.uploadProfiles();

    let testConfig = {
      brouterUri: brouterUrl,
      profiles: {
        expected: referenceProfile.name,
        actual: testProfile.name,
      },
    };

    runTestSuite(testSuite, testConfig)
      .then((testSuiteResult) => {
        testSuite = testSuiteResult;
      })
      .catch((error) => (errorMessage = error))
      .finally(() => {
        testsInProgress = false;
      });
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
        testSuite = testSuite;
      });
    }
  }

  function exportTests(event) {
    event.target.href = URL.createObjectURL(
      new Blob([JSON.stringify(testSuite)], {
        type: "application/json",
      })
    );
  }

  function resetTests() {
    testSuite = _.cloneDeep(TESTS);
  }
</script>

<!-- svetestrap styles -->
<Styles />

<main>
  <Container fluid>
    <h1 id="brouter-tester" class="display-1">BRouter profiles tester</h1>
    <Row>
      <Col lg="4">
        <h2>Settings</h2>
        <TestSettings
          bind:testProfile
          bind:referenceProfile
          bind:brouterUrl
          bind:brouterWebUrl
          bind:tileUrl
          bind:this={testSettings}
        />
        {#if errorMessage}
          <p class="error" id="error">ERROR: {errorMessage}</p>
        {/if}
        {#if statusMessage}
          <p id="status">{statusMessage}</p>
        {/if}
        <h2>Instructions</h2>
        <p>To add a new test follow these steps</p>
        <ul>
          <li>
            Use <a href={brouterWebUrl}>brouter-web</a> to find create a route which
            shows bad routing behaviour when using just two points.
          </li>
          <li>
            Manually improve the routing in brouter-web by adding more points
            and export the result as GeoJSON. Try to use a sensible name because
            it is used as test description.
          </li>
          <li>Improve profile code using brouter-web to test your changes.</li>
          <li>
            Import your test to brouter-profiles-tester and run the tests to see
            if your profile changes affect other tests.
          </li>
        </ul>
      </Col>
      <Col lg="4">
        <h2>Tests</h2>
        <ButtonGroup role="toolbar" aria-label="Test actions">
          <Button color="primary" on:click={runTests}>
            {#if testsInProgress}
              <Spinner type="border" size="sm" />
            {/if}
            Run
          </Button>
          <Button
            on:click={() => {
              fileInput.click();
            }}>Import</Button
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
            on:click={exportTests}
            on:keypress={exportTests}>Export</a
          >
          <Button secondary on:click={resetTests}>Reset</Button>
        </ButtonGroup>
        <div class="summary">
          <ul class="list-unstyled">
            {#each testSuite as testCase, testCaseIndex}
              <li>
                {#if testCase.testResult?.ok()}<i
                    class="bi bi-check-circle-fill text-success"
                  />
                {:else if testCase.testResult?.ok() == false}<i
                    class="bi bi-exclamation-circle-fill text-danger"
                  />
                {:else}<i class="bi bi-question-circle-fill" />
                {/if}
                <a href="#testcase-{testCaseIndex}">{testCase.description}</a>
              </li>
            {/each}
          </ul>
        </div>
      </Col>
      <Col lg="4">
        <h2>Results</h2>
        <TestResults {testSuite} {brouterWebUrl} {testProfile} {tileUrl} />
      </Col>
    </Row>
  </Container>
</main>

<style>
  .error {
    font-weight: bold;
    color: red;
  }
</style>

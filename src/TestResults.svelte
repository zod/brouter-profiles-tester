<script>
  import L from "leaflet";
  import "leaflet/dist/leaflet.css";

  export let testSuite;
  export let brouterWebUrl;
  export let referenceProfile;
  export let tileUrl;

  function brouterWebDebugUrl(brouterWebUrl, testCase) {
    return (
      brouterWebUrl +
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
      referenceProfile
    );
  }

  function mapAction(node, testCase) {
    let startPoint = testCase.start_point;
    let endPoint = testCase.end_point;

    let map = L.map(node);

    L.tileLayer(tileUrl, {
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

    let layerHuman = L.geoJSON(null, { style: { color: "#5CA423" } }).addTo(
      map
    );
    if (testCase.human) {
      layerHuman.clearLayers();
      layerHuman.addData(testCase.human);
    }

    let layerExpected = L.geoJSON(null).addTo(map);
    let layerActual = L.geoJSON(null, {
      style: { color: "#666666" },
    }).addTo(map);

    return {
      update: () => {
        if (testCase.testResult?.expected?.geoJSON) {
          layerExpected.clearLayers();
          layerExpected.addData(testCase.testResult.expected.geoJSON);
        }
        if (testCase.testResult?.actual?.geoJSON) {
          layerActual.clearLayers();
          layerActual.addData(testCase.testResult.actual.geoJSON);
        }
      },
      destroy: () => {
        map.remove();
      },
    };
  }
</script>

{#each testSuite as testCase, testCaseIndex}
  <div class="testcase">
    <p class="description" id={"testcase-" + testCaseIndex}>
      {testCase.description}
    </p>
    {#if testCase.testResult?.error()}
      <p class="error">ERROR: {testCase.testResult.error()}</p>
    {/if}
    <div class="map" use:mapAction={testCase} />
    <div class="footer">
      <p class="debug">
        <a href={brouterWebDebugUrl(brouterWebUrl, testCase)} target="_blank"
          >Debug this test case</a
        >
      </p>
      <p class="back-top">
        <a href="#brouter-tester">Back to top ↑</a>
      </p>
    </div>
  </div>
{/each}

<style>
  .map {
    height: 300px;
  }

  .footer {
    font-size: 0.8em;
    display: flex;
  }

  .back-top {
    flex: auto;
    text-align: right;
  }

  .debug {
    flex: auto;
    text-align: left;
  }
</style>

import RunQueue from "./run-queue.mjs";
import _ from "lodash";

class SimpleGeoJSON {
  constructor(geoJSON) {
    this.geoJSON = geoJSON;
  }

  feature() {
    return this.geoJSON.features[0];
  }

  start() {
    return this.feature().geometry.coordinates[0];
  }

  end() {
    return this.feature().geometry.coordinates[
      this.feature().geometry.coordinates.length - 1
    ];
  }
}

class TestResult {
  constructor(expected, actual) {
    this.expected = expected;
    this.actual = actual;
  }

  error() {
    return this.expected.error || this.actual.error || null;
  }

  ok() {
    let geometry_expected = this.expected?.feature?.().geometry;
    let geometry_actual = this.actual?.feature?.().geometry;
    if (!geometry_actual || !geometry_expected) {
      return false;
    }
    return _.isEqual(geometry_expected, geometry_actual);
  }
}

async function requestRoute(brouterUri, startPoint, endPoint, profile) {
  try {
    if (!profile) {
      throw "No profile";
    }
    const requestUri =
      brouterUri +
      "/brouter?" +
      "lonlats=" +
      startPoint.join(",") +
      "|" +
      endPoint.join(",") +
      "&profile=" +
      profile +
      "&alternativeidx=0&format=geojson";
    const response = await fetch(requestUri, { mode: "cors" });
    return await response.json().then((geoJSON) => new SimpleGeoJSON(geoJSON));
  } catch (error) {
    return {
      error: error,
    };
  }
}

async function uploadProfile(brouterUri, profileData) {
  const requestUri = brouterUri + "/brouter/profile";
  const response = await fetch(requestUri, {
    method: "POST",
    mode: "cors",
    body: profileData,
  });
  const responseJson = await response.json();
  if (responseJson["error"]) {
    throw responseJson["error"];
  }
  return responseJson["profileid"];
}

async function runTest(testConfig, testCase) {
  function requestRouteTest(profile) {
    return requestRoute(
      testConfig.brouterUri,
      testCase.start_point,
      testCase.end_point,
      profile
    );
  }
  const route_request_expected = requestRouteTest(testConfig.profiles.expected);
  const route_request_actual = requestRouteTest(testConfig.profiles.actual);

  try {
    const [route_expected, route_actual] = await Promise.all([
      route_request_expected,
      route_request_actual,
    ]);
    testCase.testResult = new TestResult(route_expected, route_actual);
  } catch (error) {
    testCase.error = error.message;
  }
  return testCase;
}

async function runTestSuite(testSuite, testConfig) {
  // If profile contain spaces treat them as profile content
  if (testConfig.profiles.expected.indexOf(" ") >= 0) {
    testConfig.profiles.expected = await uploadProfile(
      testConfig.brouterUri,
      testConfig.profiles.expected
    );
  }
  if (testConfig.profiles.actual.indexOf(" ") >= 0) {
    testConfig.profiles.actual = await uploadProfile(
      testConfig.brouterUri,
      testConfig.profiles.actual
    );
  }

  const runQueue = new RunQueue();
  testSuite.forEach((testCase) => {
    runQueue.add(runTest, [testConfig, testCase]);
  });

  return runQueue.run();
}

export { runTestSuite };

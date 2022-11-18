<script>
  import {
    Accordion,
    AccordionItem,
    Button,
    Form,
    FormGroup,
    Input,
    InputGroup,
    Label,
    Tooltip,
  } from "sveltestrap";

  export let brouterUrl;
  export let brouterWebUrl;
  export let tileUrl;

  export let testProfile;
  export let referenceProfile;

  export async function uploadProfiles() {
    await uploadProfile(testProfile);
    await uploadProfile(referenceProfile);
    testProfile = testProfile;
    referenceProfile = referenceProfile;
  }

  async function uploadProfile(profile) {
    if (!profile.name || profile.name?.startsWith("custom_")) {
      if (!profile.code) {
        await downloadProfile(profile);
      }
      profile.name = await uploadProfileContent(profile.code, profile.name);
    }
  }

  async function downloadProfile(profile) {
    const response = await fetch(profile.url, { mode: "cors" });
    await response.text().then((code) => (profile.code = code));
  }

  async function uploadProfileContent(profileData, profileId) {
    const requestUri =
      brouterUrl + "/brouter/profile" + (profileId ? "/" + profileId : "");
    const response = await fetch(requestUri, {
      method: "POST",
      mode: "cors",
      body: profileData,
    });
    const responseJson = await response.json();
    if (responseJson["error"]) {
      // Should show as invalid in code field
      throw responseJson["error"];
    }
    return responseJson["profileid"];
  }
</script>

<Form id="settings" on:submit={(event) => event.preventDefault()}>
  <Accordion stayOpen>
    <AccordionItem header="Test Profile" active>
      <label for="test-profile-name">Name</label>
      <InputGroup>
        <Input
          type="text"
          id="test-profile-name"
          bind:value={testProfile.name}
        />
        <Tooltip target="test-profile-name">
          Use profile name or leave empty to upload custom profile.
        </Tooltip>
      </InputGroup>

      <label for="test-profile-code">Code</label>
      <InputGroup>
        <textarea
          class="form-control form-control-sm"
          rows="20"
          bind:value={testProfile.code}
        />
      </InputGroup>

      <label for="test-profile-url">URL</label>
      <InputGroup>
        <Input type="text" bind:value={testProfile.url} />
        <Button
          outline
          secondary
          id="test-profile-download"
          on:click={() =>
            downloadProfile(testProfile).then(
              () => (testProfile = testProfile)
            )}
        >
          Get
        </Button>
        <Tooltip target="test-profile-download">
          Profile is automatically downloaded if code is empty.
        </Tooltip>
      </InputGroup>
    </AccordionItem>

    <AccordionItem header="Reference Profile" active>
      <label for="reference-profile-name">Name</label>
      <FormGroup>
        <input
          type="text"
          class="form-control"
          id="reference-profile-name"
          bind:value={referenceProfile.name}
        />
        <Tooltip target="reference-profile-name">
          Use profile name or leave empty to upload custom profile.
        </Tooltip>
      </FormGroup>

      <label for="reference-profile-code">Code</label>
      <FormGroup>
        <textarea
          class="form-control form-control-sm"
          rows="20"
          bind:value={referenceProfile.code}
        />
      </FormGroup>

      <label for="reference-profile-url">URL</label>
      <InputGroup>
        <Input type="text" bind:value={referenceProfile.url} />
        <Button
          outline
          secondary
          on:click={() =>
            downloadProfile(referenceProfile).then(
              () => (referenceProfile = referenceProfile)
            )}
        >
          Get
        </Button>
      </InputGroup>
    </AccordionItem>

    <AccordionItem header="Misc">
      <FormGroup>
        <label for="brouter-url" class="form-label">BRouter URL</label>
        <Input type="text" list="brouter-urls" bind:value={brouterUrl} />
        <datalist id="brouter-urls">
          <option value="https://brouter.de">brouter.de</option>
          <option value="https://bikerouter.de/brouter-engine">
            bikerouter.de
          </option>
        </datalist>
        <div class="form-text">
          Use a BRouter instance which provides HTTPS if this site is served
          using HTTPS
        </div>
      </FormGroup>
      <FormGroup>
        <label for="brouter-web-url" class="form-label">
          BRouter web URL (for debug)
        </label>
        <Input type="text" list="brouter-web-urls" bind:value={brouterWebUrl} />
        <datalist id="brouter-web-urls">
          <option value="https://brouter.de/brouter-web/">brouter.de</option>
          <option value="https://bikerouter.de/">bikerouter.de</option>
        </datalist>
      </FormGroup>
      <FormGroup>
        <label for="tile-url" class="form-label">Tile URL</label>
        <Input type="text" bind:value={tileUrl} />
      </FormGroup>
    </AccordionItem>
  </Accordion>
</Form>

<style>
  textarea {
    min-height: 300px;
    font-family: monospace;
  }
</style>

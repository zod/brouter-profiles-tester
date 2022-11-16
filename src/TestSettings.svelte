<script>
  export let testProfile;
  export let referenceProfile;
  export let brouterUrl;
  export let brouterWebUrl;
  export let tileUrl;
</script>

<form id="settings">
  <div class="mb-3">
    <label for="profile" class="form-label">Profile</label>
    <textarea class="form-control" rows="20" bind:value={testProfile} />
    <div class="form-text">Enter profile code, name or url</div>
  </div>
  <div class="mb-3">
    <label for="reference-profile">Reference profile</label>
    <input type="text" class="form-control" bind:value={referenceProfile} />
  </div>
  <div class="mb-3">
    <label for="brouter-url" class="form-label">BRouter URL</label>
    <input
      type="text"
      class="form-control"
      list="brouter-urls"
      bind:value={brouterUrl}
    />
    <datalist id="brouter-urls">
      <option value="https://brouter.de/">brouter.de</option>
      <option value="https://bikerouter.de/brouter-engine/"
        >bikerouter.de</option
      >
    </datalist>
    <div class="form-text">
      Use a BRouter instance which provides HTTPS if this site is served using
      HTTPS
    </div>
  </div>
  <div class="mb-3">
    <label for="brouter-web-url" class="form-label"
      >BRouter web URL (for debug)</label
    >
    <input
      type="text"
      class="form-control"
      list="brouter-web-urls"
      bind:value={brouterWebUrl}
    />
    <datalist id="brouter-web-urls">
      <option value="https://brouter.de/brouter-web/">brouter.de</option>
      <option value="https://bikerouter.de/">bikerouter.de</option>
    </datalist>
  </div>
  <div class="mb-3">
    <label for="tile-url" class="form-label">Tile URL</label>
    <input type="text" class="form-control" bind:value={tileUrl} />
  </div>
</form>

<style>
  textarea {
    min-height: 300px;
    font-family: monospace;
  }
</style>

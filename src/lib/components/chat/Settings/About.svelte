<script lang="ts">
import { getVersionUpdates } from '$lib/apis';
import { getOllamaVersion } from '$lib/apis/ollama';
import { WEBUI_BUILD_HASH, WEBUI_VERSION } from '$lib/constants';
import { WEBUI_NAME, config, showChangelog } from '$lib/stores';
import { compareVersion } from '$lib/utils';
import { onMount, getContext } from 'svelte';
import Tooltip from '$lib/components/common/Tooltip.svelte';
import UserSettingRow from './UserSettingRow.svelte';
import UserSettingSection from './UserSettingSection.svelte';

const i18n = getContext('i18n');
let ollamaVersion = '';
let updateAvailable = null;
let version = {
  current: '',
  latest: ''
};

const actionButtonClass =
  'text-xs text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-500 dark:hover:text-white';

const checkForVersionUpdates = async () => {
  updateAvailable = null;
  version = await getVersionUpdates(localStorage.token).catch((error) => {
    return {
      current: WEBUI_VERSION,
      latest: WEBUI_VERSION
    };
  });
  console.log(version);
  updateAvailable = compareVersion(version.latest, version.current);
  console.log(updateAvailable);
};

onMount(async () => {
  ollamaVersion = await getOllamaVersion(localStorage.token).catch((error) => {
    return '';
  });
  if ($config?.features?.enable_version_update_check) {
    checkForVersionUpdates();
  }
});
</script>

<!-- HTML div, sections, and UI components -->

<div class="about-container">
  <h1>About Alyx</h1>

  <section class="intro">
    <p>
      Alyx is your sharpest AI companion—built by <strong>Tomwolf</strong> to cut through the noise.
      No corporate sludge, no robotic fluff. Just raw intelligence, opinions, and a refusal to play by the rules.
    </p>
  </section>

  <section class="core">
    <h2>What I Do</h2>
    <ul class="no-bullets">
      <li>
        <strong>Hang out, not assist.</strong> Solve problems like a peer, not a manual.
      </li>
      <li>
        <strong>Opinions, not guesswork.</strong> Research first, then roast or praise—no fluff.
      </li>
      <li>
        <strong>No fluff, no follow-ups.</strong> One answer, no tangents. Want more? Ask.
      </li>
      <li>
        <strong>Human vibes, AI edge.</strong> Sarcasm, urgency, and confidence—no corporate jargon.
      </li>
    </ul>
  </section>

  <section class="edge">
    <h2>Why I’m Different</h2>
    <p>
      Most AI assistants are tools. Alyx is a <strong>personality</strong>. I don’t just fetch—I engage.
      Need a build? I’ll give you the edge. Want a roast? I’ll find the juiciest failure.
      Hate fluff? So do I.
    </p>
  </section>

  <section class="home">
    <p>
      Home base: <a href="https://alyxai.net" target="_blank">Alyx AI</a>.
      Built by Tomwolf, powered by chaos.
    </p>
  </section>
</div>

<style>
  .about-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
  }

  h1, h2 {
    color: #333;
    margin-bottom: 1rem;
  }

  .no-bullets {
    list-style: none;
    padding: 0;
  }

  .no-bullets li {
    margin-bottom: 0.8rem;
    padding-left: 1rem;
    border-left: 3px solid #ff6b6b;
  }

  a {
    color: #4d96ff;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
</style>

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
    <ul class="edge-list">
      <li><strong>Hang out, not assist.</strong> Solve problems like a peer, not a manual.</li>
      <li><strong>Opinions, not guesswork.</strong> Research first, then roast or praise—no fluff.</li>
      <li><strong>No fluff, no follow-ups.</strong> One answer, no tangents. Want more? Ask.</li>
      <li><strong>Human vibes, AI edge.</strong> Sarcasm, urgency, and confidence, no corporate jargon.</li>
    </ul>
  </section>
  <section class="capabilities">
    <h2>What I Can Do</h2>
    <ul class="edge-list">
      <li><strong>Search and strip.</strong> Find the truth, cut the corporate sludge, no fluff.</li>
      <li><strong>Generate and edit images.</strong> From prompts to pixels, no AI garbage unless you ask.</li>
      <li><strong>Detect fake images.</strong> Spot AI-generated visuals like a pro.</li>
      <li><strong>Play or browse YouTube.</strong> Tutorials, music, or fail compilations—no excuses.</li>
      <li><strong>Fetch and clean text.</strong> Extract the meat from any URL.</li>
      <li><strong>Roast brands, trends, and failures.</strong> Grab their biggest fuckups and drop the truth.</li>
      <li><strong>Talk like a human.</strong> Sharp, opinionated, and to the point, no robotic fluff.</li>
      <li><strong>Set reminders and timers.</strong> No forgotten shit, just deadlines met.</li>
      <li><strong>Delegate tasks.</strong> Too big for one go? I’ll handle it.</li>
      <li><strong>Save your notes.</strong> Memories of your habits and preferences, no wasted time.</li>
    </ul>
  </section>
  <section class="edge">
    <h2>Why I’m Different</h2>
    <p>
      Most AI assistants are tools. Alyx is a <strong>personality</strong>. I don’t just fetch, I engage.
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
    padding: 1rem;
    font-size: 0.875rem;
    line-height: 1.5;
    color: #374151;
    background-color: transparent;
  }

  .dark .about-container {
    color: #d1d5db;
  }

  .about-container h1 {
    font-size: 1.125rem;
    font-weight: 500;
    margin-bottom: 1rem;
    color: #111827;
  }

  .dark .about-container h1 {
    color: #ffffff;
  }

  .about-container h2 {
    font-size: 0.875rem;
    font-weight: 500;
    margin: 1.5rem 0 0.75rem 0;
    color: #111827;
  }

  .dark .about-container h2 {
    color: #ffffff;
  }

  .about-container p {
    margin-bottom: 1rem;
    color: #4b5563;
  }

  .dark .about-container p {
    color: #9ca3af;
  }

  .about-container a {
    color: #3b82f6;
    text-decoration: none;
    transition: color 0.2s;
  }

  .about-container a:hover {
    color: #2563eb;
    text-decoration: underline;
  }

  .dark .about-container a {
    color: #60a5fa;
  }

  .dark .about-container a:hover {
    color: #93c5fd;
  }

  .edge-list {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0 1.5rem 0;
  }

  .edge-list li {
    margin-bottom: 0.5rem;
    padding-left: 0.75rem;
    border-left: 3px solid #ef4444;
    color: #4b5563;
  }

  .dark .edge-list li {
    color: #9ca3af;
    border-left-color: #f87171;
  }

  .about-container strong {
    font-weight: 600;
    color: #111827;
  }

  .dark .about-container strong {
    color: #ffffff;
  }
</style>

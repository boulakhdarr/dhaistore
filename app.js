const form = document.querySelector('#thumbnail-form');
const input = document.querySelector('#youtube-url');
const clearButton = document.querySelector('#clear-button');
const message = document.querySelector('#form-message');
const resultSection = document.querySelector('#results');
const resultsGrid = document.querySelector('#results-grid');
const videoIdLabel = document.querySelector('#video-id-label');
const resultsStatus = document.querySelector('#results-status');

const formats = [
  { name: 'Main image', key: '0', size: '480 × 360' },
  { name: 'Image 1', key: '1', size: '120 × 90' },
  { name: 'Image 2', key: '2', size: '120 × 90' },
  { name: 'Image 3', key: '3', size: '120 × 90' },
  { name: 'High resolution', key: 'hqdefault', size: '480 × 360' },
  { name: 'Maximum resolution', key: 'maxresdefault', size: 'Up to 1920 × 1080' }
];

function extractVideoId(value) {
  try {
    const url = new URL(value.trim());
    if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('/')[0];
    if (url.hostname.includes('youtube.com')) {
      if (url.searchParams.get('v')) return url.searchParams.get('v');
      const parts = url.pathname.split('/').filter(Boolean);
      const markerIndex = parts.findIndex((part) => ['embed', 'shorts', 'live', 'v'].includes(part));
      if (markerIndex >= 0) return parts[markerIndex + 1];
    }
  } catch (error) {
    return null;
  }
  return null;
}

function isValidVideoId(videoId) {
  return Boolean(videoId && /^[\w-]{11}$/.test(videoId));
}

function updateResultsStatus() {
  const count = resultsGrid.querySelectorAll('.result-card').length;
  resultsStatus.textContent = count ? `${count} thumbnail${count > 1 ? 's' : ''} available` : 'No thumbnails available for this video.';
}

function createResultCard(videoId, format) {
  const imageUrl = `https://img.youtube.com/vi/${videoId}/${format.key}.jpg`;
  const card = document.createElement('article');
  card.className = 'result-card';
  card.innerHTML = `<img src="${imageUrl}" alt="${format.name} thumbnail for video ${videoId}" loading="lazy"><div class="result-meta"><span>${format.name}<br>${format.size}</span><a class="image-link" href="${imageUrl}" target="_blank" rel="noreferrer" aria-label="Open ${format.name}">↗</a><a class="download-button" href="${imageUrl}" download="dhai-store-${videoId}-${format.key}.jpg" target="_blank" rel="noreferrer">Download ↓</a></div>`;
  const image = card.querySelector('img');
  image.addEventListener('load', () => { if (image.naturalWidth <= 120 && format.key === 'maxresdefault') card.remove(); updateResultsStatus(); });
  image.addEventListener('error', () => { card.remove(); updateResultsStatus(); });
  return card;
}

function renderResults(videoId) {
  videoIdLabel.textContent = `Video ID: ${videoId}`;
  resultsGrid.replaceChildren(...formats.map((format) => createResultCard(videoId, format)));
  resultsStatus.textContent = 'Looking for available images...';
  resultSection.hidden = false;
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const videoId = extractVideoId(input.value);
  if (!isValidVideoId(videoId)) {
    message.textContent = 'YouTube link not recognized. Check the URL and try again.';
    input.focus();
    return;
  }
  message.textContent = '';
  renderResults(videoId);
});

clearButton.addEventListener('click', () => {
  input.value = '';
  message.textContent = '';
  input.focus();
});

const pingToggle = document.querySelector('#ping-toggle');
const pingValue = document.querySelector('#ping-value');
const pingState = document.querySelector('#ping-state');
const pingQuality = document.querySelector('#ping-quality');
const pingBars = [...document.querySelectorAll('#ping-chart i')];
let pingTimer;
let pingRunning = false;
let pingValues = [];

async function measurePing() {
  const startedAt = performance.now();
  try {
    await fetch(`https://www.google.com/generate_204?dhai-store=${Date.now()}`, { mode: 'no-cors', cache: 'no-store' });
    const latency = Math.round(performance.now() - startedAt);
    pingValues = [...pingValues.slice(-11), latency];
    pingValue.textContent = latency;
    pingQuality.textContent = latency < 80 ? 'Excellent' : latency < 180 ? 'Fair' : 'Watch closely';
    pingState.textContent = 'MEASURING';
    pingBars.forEach((bar, index) => { bar.style.height = `${Math.min(92, 18 + ((pingValues[index] || 0) / 4))}%`; });
  } catch (error) {
    pingValues = [...pingValues.slice(-11), 0];
    pingValue.textContent = '—';
    pingQuality.textContent = 'Break detected';
    pingState.textContent = 'UNSTABLE SIGNAL';
    pingBars.forEach((bar, index) => { bar.style.height = `${pingValues[index] ? '35' : '8'}%`; });
  }
}

pingToggle.addEventListener('click', () => {
  pingRunning = !pingRunning;
  if (pingRunning) {
    pingValues = [];
    pingToggle.innerHTML = '<span class="ping-button-icon">■</span> Stop test';
    measurePing();
    pingTimer = setInterval(measurePing, 1800);
  } else {
    clearInterval(pingTimer);
    pingToggle.innerHTML = '<span class="ping-button-icon">▶</span> Restart test';
    pingState.textContent = 'TEST PAUSED';
  }
});

const powerInput = document.querySelector('#power-input');
const durationInput = document.querySelector('#duration-input');
const durationUnit = document.querySelector('#duration-unit');
const daysInput = document.querySelector('#days-input');
const frequencyUnit = document.querySelector('#frequency-unit');
const priceInput = document.querySelector('#price-input');
const kwhValue = document.querySelector('#kwh-value');
const costValue = document.querySelector('#cost-value');
const calculateKwh = document.querySelector('#calculate-kwh');

function calculateConsumption() {
  const power = Number(powerInput.value) || 0;
  const duration = Number(durationInput.value) || 0;
  const frequency = Number(daysInput.value) || 0;
  const durationHours = { minute: 1 / 60, hour: 1 }[durationUnit.value];
  const frequencyDays = { day: 1, week: 7, month: 30 }[frequencyUnit.value];
  const consumption = (power / 1000) * duration * durationHours * frequency * frequencyDays;
  const price = Number(priceInput.value);
  kwhValue.textContent = consumption.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  costValue.textContent = price > 0 ? `${(consumption * price).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '—';
}

[powerInput, durationInput, durationUnit, daysInput, frequencyUnit, priceInput].forEach((field) => field.addEventListener('input', calculateConsumption));
calculateKwh.addEventListener('click', calculateConsumption);

const permissionBoxes = [...document.querySelectorAll('.permission-box')];
const octalValue = document.querySelector('#octal-value');
const symbolicValue = document.querySelector('#symbolic-value');
const chmodCommand = document.querySelector('#chmod-command');
const copyChmod = document.querySelector('#copy-chmod');
const copyStatus = document.querySelector('#copy-status');
const adSlot = document.querySelector('.ad-slot');

// Set the publisher ID here after AdSense approval, for example: ca-pub-1234567890123456.
const adsenseClient = '';
if (adsenseClient.startsWith('ca-pub-')) {
  adSlot.innerHTML = `<ins class="adsbygoogle" style="display:block" data-ad-client="${adsenseClient}" data-ad-slot="REPLACE_WITH_AD_SLOT_ID" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
  const adsenseScript = document.createElement('script');
  adsenseScript.async = true;
  adsenseScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`;
  adsenseScript.crossOrigin = 'anonymous';
  document.head.appendChild(adsenseScript);
  adsenseScript.addEventListener('load', () => { (window.adsbygoogle = window.adsbygoogle || []).push({}); });
}

function updateChmod() {
  const groups = ['owner', 'group', 'others'];
  const symbols = { 4: 'r', 2: 'w', 1: 'x' };
  const values = groups.map((group) => permissionBoxes.filter((box) => box.dataset.group === group && box.checked).reduce((total, box) => total + Number(box.dataset.value), 0));
  const symbolic = groups.map((group) => [4, 2, 1].map((value) => permissionBoxes.find((box) => box.dataset.group === group && Number(box.dataset.value) === value)?.checked ? symbols[value] : '-').join('')).join('');
  const octal = values.join('');
  octalValue.textContent = octal;
  symbolicValue.textContent = symbolic;
  chmodCommand.textContent = `chmod ${octal} path/to/file`;
  copyStatus.textContent = '';
}

permissionBoxes.forEach((box) => box.addEventListener('change', updateChmod));
copyChmod.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(chmodCommand.textContent);
    copyStatus.textContent = 'Command copied';
  } catch (error) {
    copyStatus.textContent = 'Select the command to copy';
  }
});
updateChmod();

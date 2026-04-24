import fs from 'node:fs';
import path from 'node:path';

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadDotEnv();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Missing GEMINI_API_KEY. Add it to .env or your shell env first.');
    process.exitCode = 1;
    return;
  }

  const url = new URL('https://generativelanguage.googleapis.com/v1beta/models');
  url.searchParams.set('key', apiKey);

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || `Request failed with status ${response.status}`;
    console.error(`Gemini API error: ${message}`);
    process.exitCode = 1;
    return;
  }

  const models = Array.isArray(data.models) ? data.models : [];
  if (!models.length) {
    console.log('No Gemini models returned.');
    return;
  }

  const sorted = [...models].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  console.log(`Found ${sorted.length} Gemini models:\n`);
  for (const model of sorted) {
    const name = model.name || 'unknown';
    const displayName = model.displayName || '';
    const description = model.description || '';
    const methods = Array.isArray(model.supportedGenerationMethods)
      ? model.supportedGenerationMethods.join(', ')
      : '';

    console.log(`${name}${displayName ? ` (${displayName})` : ''}`);
    if (methods) console.log(`  methods: ${methods}`);
    if (description) console.log(`  description: ${description}`);
    console.log('');
  }
}

main().catch((error) => {
  console.error('Failed to list Gemini models.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

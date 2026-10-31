import { decode, encode, PRIMER } from '../lib/lwon/index.ts';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const jsonArea = $<HTMLTextAreaElement>('json-input');
const lwonArea = $<HTMLTextAreaElement>('lwon-input');
const jsonError = $('json-error');
const lwonError = $('lwon-error');
const sampleSelect = $<HTMLSelectElement>('sample');
const bareToggle = $<HTMLInputElement>('bare');
const status = $('roundtrip');
const announcer = $('announcer');

const samples = import.meta.glob<unknown>('../data/samples/*.json', { import: 'default' });
const STARTER = {
  orders: [
    { id: 'A-1001', customer: { name: 'Ayşe Yılmaz', city: 'Istanbul' }, items: [{ sku: 'KB-01', qty: 1, price: 49.9 }, { sku: 'MS-07', qty: 2, price: 19.5 }], paid: true },
    { id: 'A-1002', customer: { name: 'John Smith', city: 'London' }, items: [{ sku: 'MN-27', qty: 1, price: 219 }], paid: false, note: 'Leave at the door' },
  ],
  page: 1,
  total: 2,
};
const STORE_KEY = 'lwon-playground';

// ---------- Conversion ----------

let current: unknown;

function canonical(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonical);
  if (v === null || typeof v !== 'object') return v;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(v).sort()) {
    Object.defineProperty(out, k, { value: canonical((v as Record<string, unknown>)[k]), enumerable: true });
  }
  return out;
}

function setError(el: HTMLElement, area: HTMLTextAreaElement, message: string | null) {
  el.textContent = message ?? '';
  el.hidden = !message;
  area.setAttribute('aria-invalid', String(Boolean(message)));
}

function fromJson() {
  let value: unknown;
  try {
    value = JSON.parse(jsonArea.value);
  } catch (e) {
    setError(jsonError, jsonArea, `Invalid JSON: ${(e as Error).message}`);
    lwonArea.classList.add('is-stale');
    return;
  }
  setError(jsonError, jsonArea, null);
  setError(lwonError, lwonArea, null);
  lwonArea.classList.remove('is-stale');
  jsonArea.classList.remove('is-stale');
  current = value;
  lwonArea.value = encode(value, { bareStrings: bareToggle.checked });
  save();
  update();
}

function fromLwon() {
  let value: unknown;
  try {
    value = decode(lwonArea.value);
  } catch (e) {
    setError(lwonError, lwonArea, (e as Error).message);
    jsonArea.classList.add('is-stale');
    return;
  }
  setError(lwonError, lwonArea, null);
  setError(jsonError, jsonArea, null);
  jsonArea.classList.remove('is-stale');
  lwonArea.classList.remove('is-stale');
  current = value;
  jsonArea.value = JSON.stringify(value, null, 2);
  save();
  update();
}

const debounce = (fn: () => void, ms: number) => {
  let t: ReturnType<typeof setTimeout>;
  return () => { clearTimeout(t); t = setTimeout(fn, ms); };
};
jsonArea.addEventListener('input', debounce(fromJson, 150));
lwonArea.addEventListener('input', debounce(fromLwon, 150));
bareToggle.addEventListener('change', () => {
  if (current !== undefined) {
    lwonArea.value = encode(current, { bareStrings: bareToggle.checked });
    update();
  }
});

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(current)); } catch {}
}

// ---------- Stats ----------

const enc = new TextEncoder();
const bytes = (s: string) => enc.encode(s).length;
const fmt = (n: number) => n.toLocaleString('en-US');

let worker: Worker | null = null;
let reqId = 0;
function countTokens(texts: string[]): Promise<number[]> {
  worker ??= new Worker(new URL('./token-worker.ts', import.meta.url), { type: 'module' });
  const id = ++reqId;
  return new Promise((resolve) => {
    const onMsg = (e: MessageEvent<{ id: number; counts: number[] }>) => {
      if (e.data.id !== id) return;
      worker!.removeEventListener('message', onMsg);
      resolve(e.data.counts);
    };
    worker!.addEventListener('message', onMsg);
    worker!.postMessage({ id, texts });
  });
}

function setStat(name: string, text: string) {
  document.querySelectorAll<HTMLElement>(`[data-stat="${name}"]`).forEach((el) => (el.textContent = text));
}

function setBars(json: number, lwon: number) {
  const max = Math.max(json, lwon, 1);
  $('bar-json').style.setProperty('--f', String(json / max));
  $('bar-lwon').style.setProperty('--f', String(lwon / max));
}

async function update() {
  const min = JSON.stringify(current);
  const lwon = lwonArea.value;
  const ok = JSON.stringify(canonical(decode(lwon))) === JSON.stringify(canonical(current));
  status.dataset.ok = String(ok);
  status.textContent = ok ? 'Round trip verified' : 'Round trip failed';

  const b = { json: bytes(min), lwon: bytes(lwon) };
  setStat('json-bytes', `${fmt(b.json)} B`);
  setStat('lwon-bytes', `${fmt(b.lwon)} B`);
  setStat('bytes-saved', pct(b.lwon, b.json));
  setStat('json-tokens', '…');
  setStat('lwon-tokens', '…');
  setStat('tokens-saved', '…');

  const id = reqId + 1;
  const [tj, tl] = await countTokens([min, lwon]);
  if (id !== reqId) return; // a newer edit is being counted
  setStat('json-tokens', fmt(tj));
  setStat('lwon-tokens', fmt(tl));
  setStat('tokens-saved', pct(tl, tj));
  setBars(tj, tl);
  announcer.textContent = `LWON uses ${fmt(tl)} tokens, ${pct(tl, tj)} compared with ${fmt(tj)} for minified JSON.`;
}

function pct(now: number, base: number) {
  if (!base) return '0%';
  const d = Math.round((now / base - 1) * 100);
  return d === 0 ? '±0%' : d > 0 ? `+${d}%` : `−${-d}%`;
}

// ---------- Samples, copy ----------

async function load(value: unknown) {
  current = value;
  jsonArea.value = JSON.stringify(value, null, 2);
  fromJson();
}

sampleSelect.addEventListener('change', async () => {
  const name = sampleSelect.value;
  if (!name) return;
  const loader = samples[`../data/samples/${name}.json`];
  await load(name === 'starter' || !loader ? STARTER : await loader());
});

document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const what = btn.dataset.copy;
    const text = what === 'json' ? jsonArea.value : what === 'primer' ? `${PRIMER}\n\n${lwonArea.value}` : lwonArea.value;
    try {
      await navigator.clipboard.writeText(text);
      const label = btn.textContent;
      btn.textContent = 'Copied';
      announcer.textContent = 'Copied to the clipboard.';
      setTimeout(() => (btn.textContent = label), 1400);
    } catch {
      announcer.textContent = 'Copy failed. Select the text and copy it by hand.';
    }
  });
});

$('format-json').addEventListener('click', () => {
  if (current === undefined) return;
  const pretty = JSON.stringify(current, null, 2);
  jsonArea.value = jsonArea.value === pretty ? JSON.stringify(current) : pretty;
});

// ---------- Start ----------

let initial: unknown = STARTER;
try {
  const saved = localStorage.getItem(STORE_KEY);
  if (saved) initial = JSON.parse(saved);
} catch {}
load(initial);

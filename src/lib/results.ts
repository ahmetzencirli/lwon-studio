// Benchmark and eval results in the shapes the pages need.
import bench from '../data/bench.json';
import evalResults from '../data/eval.json';
import sparseResults from '../data/eval-sparse.json';

export type Fmt = 'json' | 'toon' | 'lwon';
type TokenCell = { raw: number; prompt: number };

/** Haiku, Sonnet and Opus 5.5 share a tokenizer, so any of them gives the Claude counts. */
const claudeTokens = Object.values(evalResults.tokens)[0] as Record<string, Record<Fmt, TokenCell>>;
export const claudeModels = Object.keys(evalResults.tokens);

export interface Dataset {
  name: string;
  shape: string;
  /** Claude tokens for the data alone. */
  claude: Record<Fmt, number>;
  /** Claude tokens for LWON with its primer. */
  lwonWithPrimer: number;
  o200k: { pretty: number; json: number; toon: number; lwon: number };
}

export const datasets: Dataset[] = bench.results.map((r) => {
  const c = claudeTokens[r.name];
  return {
    name: r.name,
    shape: r.shape,
    claude: { json: c.json.raw, toon: c.toon.raw, lwon: c.lwon.raw },
    lwonWithPrimer: c.lwon.prompt,
    o200k: { pretty: r.tokens.pretty, json: r.tokens.min, toon: r.tokens.toon, lwon: r.tokens.lwon },
  };
});

const savings = datasets.map((d) => 1 - d.claude.lwon / d.claude.json);
/** e.g. "22–42%": LWON's saving over minified JSON, in Claude tokens. */
export const savingsRange = `${Math.round(Math.min(...savings) * 100)}–${Math.round(Math.max(...savings) * 100)}%`;
export const medianSaving = [...savings].sort((a, b) => a - b)[Math.floor(savings.length / 2)];

/** Claude tokens the primer and data tags add, averaged over the datasets. */
export const primerTokens = Math.round(
  datasets.reduce((s, d) => s + d.lwonWithPrimer - d.claude.lwon, 0) / datasets.length,
);

export interface Accuracy { label: string; cells: Record<Fmt, { correct: number; total: number }> }
export interface PerQuestion { label: string; cells: Record<Fmt, { output: number; once: number; cached: number }> }

const order = ['claude-haiku-5-5', 'claude-haiku-5-5 (effort low)', 'claude-sonnet-5-5', 'claude-opus-5-5'];
const pretty = (label: string) =>
  label.replace('claude-', 'Claude ').replace(/-(\d)-(\d)/, ' $1.$2').replace('haiku', 'Haiku').replace('sonnet', 'Sonnet').replace('opus', 'Opus');
const rows = <T>(o: Record<string, T>) =>
  Object.entries(o).sort(([a], [b]) => order.indexOf(a) - order.indexOf(b)).map(([label, cells]) => ({ label: pretty(label), cells }));

export const accuracy: Accuracy[] = rows(evalResults.summary as Record<string, Accuracy['cells']>);
export const questionCount = accuracy[0]?.cells.json.total ?? 0;
export const basicPerQuestion: PerQuestion[] = rows(evalResults.perQuestion as Record<string, PerQuestion['cells']>);

/** The harder suite: 150 sparse log events, each question asked several times. */
export const sparse = {
  trials: sparseResults.trials,
  accuracy: rows(sparseResults.summary as Record<string, Accuracy['cells']>),
  perQuestion: rows(sparseResults.perQuestion as Record<string, PerQuestion['cells']>),
  tokens: (Object.values(sparseResults.tokens)[0] as Record<string, Record<Fmt, TokenCell>>).sparse,
};

/** Signed change against a baseline, e.g. "−24%" or "+41%". */
export const change = (n: number, base: number) => {
  const d = Math.round((n / base - 1) * 100);
  return d === 0 ? '±0%' : d > 0 ? `+${d}%` : `−${-d}%`;
};

// Counts o200k tokens off the main thread; the tokenizer data is about 1 MB.
import { countTokens } from 'gpt-tokenizer/encoding/o200k_base';

self.onmessage = (e: MessageEvent<{ id: number; texts: string[] }>) => {
  const counts = e.data.texts.map((t) => countTokens(t));
  self.postMessage({ id: e.data.id, counts });
};

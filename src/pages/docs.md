---
layout: ../layouts/Prose.astro
title: Docs
description: Install the LWON library, encode and decode from JavaScript or TypeScript, and use the command line tool.
---

# Docs

The reference library is written in TypeScript, has no runtime dependencies and
runs in Node.js 20+, Deno, Bun and browsers.

> **Status:** LWON is in 1.0 beta. The `lwon` package will be published to npm
> once the format is final. Until then, use the source from
> [GitHub](https://github.com/ahmetzencirli/lwon) or try it in the
> [playground](playground).

## Install

```bash
npm install lwon
```

## Encode and decode

```ts
import { encode, decode } from 'lwon';

const text = encode([
  { id: 1, name: 'Ada', role: 'admin' },
  { id: 2, name: 'Linus', role: 'dev' },
]);
// id name role
// [
// [1 Ada admin]
// [2 Linus dev]
// ]

decode(text); // the same array back
```

`encode` accepts anything `JSON.stringify` accepts, with the same rules: `Date`
becomes a string, `undefined` object keys are dropped, and `toJSON` is honoured.
`decode` returns plain JSON values.

Object key order is not significant in JSON, and LWON may change it: keys come
back in header order. Everything else round-trips exactly.

## Options

```ts
encode(value, { bareStrings: false });
```

| Option | Default | Effect |
|---|---|---|
| `bareStrings` | `true` | Write strings such as `Alice` or `user@example.com` without quotes. Set `false` to quote every string. |
| `keyedBelow` | `0.5` | Keys found in fewer than this share of the rows are written by name in the row's `*` slot instead of by position. Set `0` to keep every key positional. |

### Sparse keys

When most objects lack a key, writing it by position fills rows with `~`, and
language models spend extra reasoning to line the values up. By default such
keys move to a `*` slot at the end of the header, and each row names them:

```text
id level userId *
[
[1 info 7]
[2 warn ~ {"retry":2,"region":null}]
]
```

In our evals this brought the extra reasoning on sparse data close to JSON's,
at the cost of a few more tokens. See [Benchmarks](benchmarks#cost).

## Errors

`decode` throws an `LwonError` with the position of the problem:

```ts
import { decode, LwonError } from 'lwon';

try {
  decode('id name\n[[1 Ada extra]]');
} catch (e) {
  if (e instanceof LwonError) {
    e.message; // "Record has more values than the 2 fields in its header (line 2, column 9)"
    e.line;    // 2
    e.column;  // 9
  }
}
```

## Prompts

`PRIMER` is a short explanation of the format for language models. Send it once
alongside LWON data. See [For AI](ai) for when this pays off.

```ts
import { encode, PRIMER } from 'lwon';

const prompt = `${PRIMER}\n\n${encode(toolResult)}`;
```

## Command line

```bash
npx lwon encode data.json > data.lwon   # JSON to LWON
npx lwon decode data.lwon --pretty      # LWON to JSON
npx lwon stats data.json                # bytes for indented JSON, minified JSON and LWON
npx lwon primer                         # print the prompt primer
```

Every command reads standard input when no file is given.

## Other languages

The [conformance suite](https://github.com/ahmetzencirli/lwon/tree/main/conformance)
is plain JSON, so any implementation can run it:

| File | What an implementation must do |
|---|---|
| `roundtrip.json` | `decode(encode(json))` equals `json` |
| `decode.json` | `decode(lwon)` equals `json` |
| `invalid.json` | `decode(lwon)` fails |
| `encode.json` | The reference encoder's exact output. Optional for other encoders. |

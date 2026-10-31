// Small syntax highlighters for LWON and JSON. They return HTML with `tk-*` spans.
import { headerEnd } from './lwon/shape.ts';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const span = (cls: string, s: string) => `<span class="tk-${cls}">${esc(s)}</span>`;

const NUMBER = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;

export function highlightJson(src: string): string {
  return src.replace(
    /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}[\],:])|([^"\d{}[\],:tfn-]+|.)/g,
    (m, str, colon, num, lit, punct) => {
      if (str) return colon ? span('key', str) + span('punct', colon) : span('str', str);
      if (num) return span('num', num);
      if (lit) return span('lit', lit);
      if (punct) return span('punct', punct);
      return esc(m);
    },
  );
}

export function highlightLwon(src: string): string {
  const end = headerEnd(src);
  return highlightHeader(src.slice(0, end)) + highlightBody(src.slice(end));
}

function highlightHeader(src: string): string {
  return src.replace(/("(?:[^"\\]|\\.)*")|(@[^\s[\]{}"]*)|([[\]{}*])|([^\s[\]{}"@]+)|(\s+)/g, (m, str, ref, punct, key) => {
    if (str || key) return span('key', m);
    if (ref) return span('ref', ref);
    if (punct) return span('punct', punct);
    return esc(m);
  });
}

function highlightBody(src: string): string {
  return src.replace(/("(?:[^"\\]|\\.)*")|([[\]{}:,])|(~)(?=[\s\]]|$)|([^\s[\]{}",:]+)|(\s+)/g, (m, str, punct, absent, word) => {
    if (str) return span('str', str);
    if (punct) return span('punct', punct);
    if (absent) return span('absent', absent);
    if (word) {
      if (word === 'null' || word === 'true' || word === 'false') return span('lit', word);
      if (NUMBER.test(word)) return span('num', word);
      return span('str', word);
    }
    return esc(m);
  });
}

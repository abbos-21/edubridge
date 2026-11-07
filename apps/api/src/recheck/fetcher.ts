import dns from 'node:dns';
import { createHash } from 'node:crypto';
import { Agent, fetch as undiciFetch } from 'undici';
import { checkRecheckUrl, isPublicIp } from './ssrf';

export type FetchOutcome =
  | { kind: 'ok'; status: number; finalUrl: string; hash: string; text: string; contentType: string }
  | { kind: 'blocked'; reason: 'robots' | 'forbidden' | 'rate_limited' | 'captcha'; status?: number; finalUrl: string }
  | { kind: 'broken'; status: number | null; reason: string; finalUrl: string };

export type FetcherOptions = {
  userAgent: string;
  hostDelayMs: number;
  timeoutMs: number;
  retries: number;
  maxBytes: number;
  maxRedirects: number;
  /** Tests only: lets the fetcher reach 127.0.0.1. Never set from configuration. */
  allowPrivate?: boolean;
  sleep?: (ms: number) => Promise<void>;
};

export const DEFAULT_FETCH: FetcherOptions = { userAgent: 'EduBridgeBot/1.0', hostDelayMs: 2000, timeoutMs: 15_000, retries: 2, maxBytes: 1_500_000, maxRedirects: 5 };

/** Readable text of an HTML page: no scripts, styles, tags or whitespace noise. */
export function htmlToText(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|li|tr|h[1-6]|br|section|article)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/[ \t\f\v ]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

type Robots = { rules: Array<{ allow: boolean; path: string }>; ok: boolean; internal?: boolean };

/** Minimal robots.txt: our own group if present, else `*`. Longest matching rule wins; Allow beats Disallow on ties. */
export function parseRobots(text: string, agent: string): Robots['rules'] {
  const groups: Array<{ agents: string[]; rules: Robots['rules'] }> = [];
  let cur: (typeof groups)[number] | null = null;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1]!.toLowerCase();
    const val = m[2]!.trim();
    if (key === 'user-agent') {
      if (!cur || !lastWasAgent) { cur = { agents: [], rules: [] }; groups.push(cur); }
      cur.agents.push(val.toLowerCase());
      lastWasAgent = true;
    } else if ((key === 'allow' || key === 'disallow') && cur) {
      lastWasAgent = false;
      if (val) cur.rules.push({ allow: key === 'allow', path: val });
      else if (key === 'disallow') { /* empty Disallow allows everything */ }
    } else lastWasAgent = false;
  }
  const name = agent.toLowerCase().split('/')[0]!;
  const mine = groups.find((g) => g.agents.some((a) => a !== '*' && name.includes(a))) ?? groups.find((g) => g.agents.includes('*'));
  return mine?.rules ?? [];
}

export function robotsAllows(rules: Robots['rules'], pathAndQuery: string): boolean {
  let best: { allow: boolean; len: number } | null = null;
  for (const r of rules) {
    const pattern = r.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$');
    if (new RegExp('^' + pattern).test(pathAndQuery)) {
      const len = r.path.length;
      if (!best || len > best.len || (len === best.len && r.allow)) best = { allow: r.allow, len };
    }
  }
  return best ? best.allow : true;
}

/**
 * A polite, safe fetcher for the monthly recheck: identifies itself, obeys robots.txt, limits the rate per host,
 * times out, retries, follows few redirects, reads a capped body, and refuses private/internal addresses at the
 * moment of connecting (so DNS tricks cannot slip through). It never logs in, never solves a CAPTCHA, and gives
 * up on pages that refuse robots (they go on a "needs manual check" list).
 */
export class PoliteFetcher {
  private lastAt = new Map<string, number>();
  private robots = new Map<string, Promise<Robots>>();
  private agent: Agent;
  private o: FetcherOptions;
  private sleep: (ms: number) => Promise<void>;

  constructor(opts: Partial<FetcherOptions> = {}) {
    this.o = { ...DEFAULT_FETCH, ...opts };
    this.sleep = this.o.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
    const allowPrivate = !!this.o.allowPrivate;
    this.agent = new Agent({
      connect: {
        lookup: (hostname, options, cb) => {
          dns.lookup(hostname, { ...options, all: true }, (err, addrs) => {
            if (err) return (cb as (e: Error | null) => void)(err);
            const list = (addrs as dns.LookupAddress[]).filter((a) => allowPrivate || isPublicIp(a.address));
            if (!list.length) return (cb as (e: Error | null) => void)(Object.assign(new Error('blocked_address'), { code: 'EBLOCKED' }));
            if (options.all) return (cb as (e: null, a: dns.LookupAddress[]) => void)(null, list);
            return (cb as (e: null, a: string, f: number) => void)(null, list[0]!.address, list[0]!.family);
          });
        },
      },
    });
  }

  close() {
    return this.agent.close();
  }

  private async throttle(host: string) {
    const wait = (this.lastAt.get(host) ?? 0) + this.o.hostDelayMs - Date.now();
    this.lastAt.set(host, Math.max(Date.now(), (this.lastAt.get(host) ?? 0) + this.o.hostDelayMs));
    if (wait > 0) await this.sleep(wait);
  }

  private async raw(url: string, accept: string): Promise<{ status: number; headers: Headers; body: Buffer; finalUrl: string; redirectedTo?: string }> {
    let current = url;
    for (let hop = 0; ; hop++) {
      const chk = checkRecheckUrl(current, !!this.o.allowPrivate);
      if (!chk.ok) throw Object.assign(new Error(chk.reason), { code: 'EBLOCKED' });
      await this.throttle(chk.url.host);
      const res = await undiciFetch(current, {
        redirect: 'manual',
        headers: { 'user-agent': this.o.userAgent, accept, 'accept-language': 'en' },
        signal: AbortSignal.timeout(this.o.timeoutMs),
        dispatcher: this.agent,
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        if (hop >= this.o.maxRedirects) throw new Error('too_many_redirects');
        current = new URL(res.headers.get('location')!, current).toString();
        await res.body?.cancel();
        continue;
      }
      // read at most maxBytes
      const chunks: Buffer[] = [];
      let size = 0;
      const reader = res.body?.getReader();
      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.length;
          chunks.push(Buffer.from(value));
          if (size > this.o.maxBytes) { await reader.cancel(); break; }
        }
      }
      return { status: res.status, headers: res.headers, body: Buffer.concat(chunks).subarray(0, this.o.maxBytes), finalUrl: current };
    }
  }

  private robotsFor(origin: string): Promise<Robots> {
    let p = this.robots.get(origin);
    if (!p) {
      p = (async (): Promise<Robots> => {
        try {
          const r = await this.raw(`${origin}/robots.txt`, 'text/plain');
          if (r.status >= 500) return { rules: [], ok: false }; // cannot tell: do not fetch
          if (r.status >= 400) return { rules: [], ok: true }; // no robots.txt: allowed
          return { rules: parseRobots(r.body.toString('utf8'), this.o.userAgent), ok: true };
        } catch (e) {
          const err = e as { code?: string; message?: string; cause?: { code?: string; message?: string } };
          const internal = err.code === 'EBLOCKED' || err.cause?.code === 'EBLOCKED' || /blocked_address/.test(err.cause?.message ?? err.message ?? '');
          return { rules: [], ok: false, internal };
        }
      })();
      this.robots.set(origin, p);
    }
    return p;
  }

  async fetchPage(url: string): Promise<FetchOutcome> {
    const chk = checkRecheckUrl(url, !!this.o.allowPrivate);
    if (!chk.ok) return { kind: 'broken', status: null, reason: chk.reason, finalUrl: url };
    const robots = await this.robotsFor(chk.url.origin);
    if (robots.internal) return { kind: 'broken', status: null, reason: 'blocked_address', finalUrl: url };
    if (!robots.ok || !robotsAllows(robots.rules, chk.url.pathname + chk.url.search)) return { kind: 'blocked', reason: 'robots', finalUrl: url };

    let lastErr = 'network';
    for (let attempt = 0; attempt <= this.o.retries; attempt++) {
      if (attempt > 0) await this.sleep(Math.min(8000, 1000 * 2 ** (attempt - 1)));
      try {
        const r = await this.raw(url, 'text/html,application/pdf;q=0.9,*/*;q=0.5');
        if (r.status === 403 || r.status === 401) return { kind: 'blocked', reason: 'forbidden', status: r.status, finalUrl: r.finalUrl };
        if (r.status === 429) return { kind: 'blocked', reason: 'rate_limited', status: r.status, finalUrl: r.finalUrl };
        if (r.status >= 500) { lastErr = `http_${r.status}`; continue; }
        if (r.status >= 400) return { kind: 'broken', status: r.status, reason: `http_${r.status}`, finalUrl: r.finalUrl };
        const contentType = (r.headers.get('content-type') ?? '').split(';')[0]!.trim().toLowerCase();
        if (r.headers.get('cf-mitigated') || /captcha|are you a robot|verify you are human/i.test(r.body.subarray(0, 20_000).toString('utf8').slice(0, 5000)) && r.body.length < 20_000) {
          return { kind: 'blocked', reason: 'captcha', status: r.status, finalUrl: r.finalUrl };
        }
        const isText = /html|xml|text\//.test(contentType) || contentType === '';
        const text = isText ? htmlToText(r.body.toString('utf8')) : '';
        const hash = createHash('sha256').update(isText ? text : r.body).digest('hex');
        return { kind: 'ok', status: r.status, finalUrl: r.finalUrl, hash, text, contentType };
      } catch (e) {
        const err = e as { code?: string; message?: string; cause?: { code?: string; message?: string } };
        if (err.code === 'EBLOCKED' || err.cause?.code === 'EBLOCKED' || /blocked_address/.test(err.cause?.message ?? err.message ?? '')) return { kind: 'broken', status: null, reason: 'blocked_address', finalUrl: url };
        lastErr = (e as Error).name === 'TimeoutError' ? 'timeout' : (e as Error).message === 'too_many_redirects' ? 'too_many_redirects' : 'network';
        if (lastErr === 'too_many_redirects') break;
      }
    }
    return { kind: 'broken', status: null, reason: lastErr, finalUrl: url };
  }
}

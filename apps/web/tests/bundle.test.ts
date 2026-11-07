import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

describe('web build contains no secrets (ToR T15 / H6)', () => {
  it('no API key, token or credential name appears in the built files, and the initial JS stays under 2 MB', () => {
    const out = mkdtempSync(join(tmpdir(), 'eb-build-'));
    execSync(`npx vite build --outDir "${out}" --emptyOutDir`, { cwd: join(__dirname, '..'), stdio: 'pipe' });
    const all = files(out);
    const forbidden = [/sk-ant-[A-Za-z0-9_-]{10,}/, /ANTHROPIC_API_KEY/, /TELEGRAM_BOT_TOKEN/, /GOOGLE_CLIENT_SECRET/, /SESSION_SECRET/, /DATABASE_URL/, /postgres(ql)?:\/\//i];
    for (const f of all.filter((x) => /\.(js|css|html|json)$/.test(x))) {
      const text = readFileSync(f, 'utf8');
      for (const re of forbidden) expect(re.test(text), `${f} matches ${re}`).toBe(false);
    }
    const html = readFileSync(join(out, 'index.html'), 'utf8');
    const entry = /src="\/assets\/(index-[^"]+\.js)"/.exec(html)![1]!;
    expect(statSync(join(out, 'assets', entry)).size).toBeLessThan(2 * 1024 * 1024);
  }, 120_000);
});

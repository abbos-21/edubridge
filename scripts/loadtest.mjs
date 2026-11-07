// Load test for the read paths students hit most.
//   node scripts/loadtest.mjs [baseUrl] [connections] [seconds]
// Scale target (ToR H): 5,000 registered users, 200 concurrent. Run it against a production-like stack
// (docker-compose.prod.yml), with RATE_LIMIT_PER_MIN raised, because all test traffic comes from one IP.
import autocannon from 'autocannon';

const base = process.argv[2] ?? 'http://localhost';
const connections = Number(process.argv[3] ?? 200);
const duration = Number(process.argv[4] ?? 20);

const targets = [
  { name: 'web app shell  GET /', path: '/' },
  { name: 'catalogue      GET /api/v1/catalog/universities', path: '/api/v1/catalog/universities' },
  { name: 'country page   GET /api/v1/catalog/countries/HU', path: '/api/v1/catalog/countries/HU' },
  { name: 'one university GET /api/v1/catalog/universities/elte-hu', path: '/api/v1/catalog/universities/elte-hu' },
  { name: 'version check  GET /api/v1/catalog/version', path: '/api/v1/catalog/version' },
  { name: 'session check  GET /api/v1/auth/session (guest)', path: '/api/v1/auth/session' },
];

const rows = [];
for (const t of targets) {
  const r = await autocannon({ url: base + t.path, connections, duration, headers: { 'accept-encoding': 'gzip' } });
  rows.push({
    target: t.name,
    'req/s': Math.round(r.requests.average),
    'p50 ms': r.latency.p50,
    'p97.5 ms': r.latency.p97_5,
    'p99 ms': r.latency.p99,
    '2xx': r['2xx'],
    'non-2xx': r.non2xx,
    errors: r.errors,
    timeouts: r.timeouts,
  });
}
console.table(rows);
const bad = rows.filter((r) => r['non-2xx'] > 0 || r.errors > 0 || r.timeouts > 0);
console.log(bad.length ? `PROBLEMS in ${bad.length} target(s)` : `OK: no errors or timeouts at ${connections} concurrent connections for ${duration}s per target`);
process.exit(bad.length ? 1 : 0);

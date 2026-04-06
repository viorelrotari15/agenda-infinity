/**
 * Load / stress test against a running API (default http://127.0.0.1:3001).
 * Requires the API process or `docker compose up` stack to be reachable.
 *
 * Env:
 *   BASE_URL          — origin without trailing slash (default http://127.0.0.1:3001)
 *   PERF_CONNECTIONS  — concurrent connections (default 30)
 *   PERF_DURATION_SEC — seconds per scenario (default 30)
 *   PERF_MAX_ERROR_RATE — max allowed connection/socket error rate 0–1 (default 0.02)
 *   PERF_MAX_NON2XX_RATE — max allowed HTTP non-2xx rate 0–1 (default 0.05)
 *   PERF_MAX_P99_MS    — max allowed p99 latency ms (default 5000)
 */
import autocannon from 'autocannon';

const base = (process.env.BASE_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
const connections = Number(process.env.PERF_CONNECTIONS || 30);
const duration = Number(process.env.PERF_DURATION_SEC || 30);
const maxErrorRate = Number(process.env.PERF_MAX_ERROR_RATE ?? 0.02);
const maxNon2xxRate = Number(process.env.PERF_MAX_NON2XX_RATE ?? 0.05);
const maxP99Ms = Number(process.env.PERF_MAX_P99_MS || 5000);

const paths = ['/api/specialists', '/api/banners'];

function rate(num, den) {
  return den > 0 ? num / den : 0;
}

async function runScenario(path) {
  const url = `${base}${path}`;
  console.log(`\n→ ${url} (${connections} connections, ${duration}s)`);

  const result = await autocannon({
    url,
    connections,
    duration,
    method: 'GET',
    headers: { accept: 'application/json' },
  });

  const total = result.requests?.total ?? 0;
  const errors = result.errors ?? 0;
  const non2xx = result.non2xx ?? 0;
  const p99 = result.latency?.p99 ?? 0;
  const throughput = result.throughput?.average ?? 0;

  const errRate = rate(errors, total + errors);
  const badHttpRate = rate(non2xx, total);

  console.log(
    JSON.stringify(
      {
        path,
        requests: total,
        errors,
        non2xx,
        errorRate: Number(errRate.toFixed(4)),
        non2xxRate: Number(badHttpRate.toFixed(4)),
        p99Ms: Math.round(p99),
        throughputAvg: Math.round(throughput),
      },
      null,
      2,
    ),
  );

  if (errRate > maxErrorRate) {
    throw new Error(`Socket/connection error rate ${errRate} > ${maxErrorRate}`);
  }
  if (badHttpRate > maxNon2xxRate) {
    throw new Error(`HTTP non-2xx rate ${badHttpRate} > ${maxNon2xxRate}`);
  }
  if (p99 > maxP99Ms) {
    throw new Error(`p99 latency ${p99}ms > ${maxP99Ms}ms`);
  }
}

async function main() {
  console.log(`Stress test against ${base}`);

  for (const p of paths) {
    await runScenario(p);
  }

  console.log('\nAll stress scenarios passed thresholds.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

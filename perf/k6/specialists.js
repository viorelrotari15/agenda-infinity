/**
 * k6 load test — install k6, then:
 *   BASE_URL=http://127.0.0.1:3001 k6 run perf/k6/specialists.js
 *
 * Or with Docker:
 *   docker run --rm -i -e BASE_URL=http://host.docker.internal:3001 grafana/k6 run - < perf/k6/specialists.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const base = __ENV.BASE_URL || 'http://127.0.0.1:3001';

export const options = {
  stages: [
    { duration: '20s', target: 10 },
    { duration: '40s', target: 30 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<5000'],
  },
};

export default function () {
  const r1 = http.get(`${base}/api/specialists`);
  check(r1, { 'specialists 200': (r) => r.status === 200 });
  sleep(0.05);

  const r2 = http.get(`${base}/api/banners`);
  check(r2, { 'banners 200': (r) => r.status === 200 });
  sleep(0.05);
}

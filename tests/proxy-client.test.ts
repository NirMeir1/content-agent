import { it, expect, vi, afterEach } from 'vitest';
import { seededState } from '../src/lib/demo';
import { createPlan } from '../src/lib/ai';
vi.mock('../src/lib/db', () => ({ reserveGeneration: vi.fn() }));
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it.each([401, 403, 429, 502])('preserves the workspace when the proxy returns %s', async status => {
  vi.stubEnv('OPENAI_API_KEY', ''); vi.stubEnv('BOTTOMLINE_PROXY_URL', 'https://example.invalid/generate'); vi.stubEnv('BOTTOMLINE_CLIENT_TOKEN', 'test-scoped-access');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status })));
  const state = seededState(), before = structuredClone(state);
  await expect(createPlan(state, '2027-03', 'בדיקה', 2)).rejects.toThrow('הנתונים נשמרו');
  expect(state).toEqual(before);
});
it('reports missing internet without converting the failure to fictional AI output', async () => {
  vi.stubEnv('OPENAI_API_KEY', ''); vi.stubEnv('BOTTOMLINE_PROXY_URL', 'https://example.invalid/generate');
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network unavailable')));
  await expect(createPlan(seededState(), '2027-03', 'בדיקה', 2)).rejects.toThrow('בדקו חיבור לאינטרנט');
});

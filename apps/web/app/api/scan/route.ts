import { NextRequest } from 'next/server';
import { runScan, runScanWithSites } from '../../../lib/engine';
import { runFastRecon } from '../../../lib/fast';
import { INFOOOZE_URLS } from '../../../lib/sites.infoooze';
import { canonicalPlatformIdFromUrl } from '../../../lib/platforms';
import { CORE_SITES } from '../../../lib/sites.core';

function sseSerialize(obj: any) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username') || '';
  const tier = (searchParams.get('tier') as 'fundamental' | 'core' | 'optional') || 'fundamental';
  const mode = (searchParams.get('mode') as 'precise' | 'fast') || 'precise';

  const stream = new ReadableStream({
    async start(controller) {
      const write = (obj: any) => controller.enqueue(new TextEncoder().encode(sseSerialize(obj)));
      const platformIdFromUrl = canonicalPlatformIdFromUrl;
      try {
        if (!username) {
          write({ type: 'done', summary: { done: 0, total: 0 } });
          controller.close();
          return;
        }

        if (mode === 'fast') {
          // status-only based on infoooze URL list
          const urls = INFOOOZE_URLS.map(t => t.split('{username}').join(username));
          write({ type: 'progress', done: 0, total: urls.length });
          const startAt = Date.now();
          let done = 0;
          const results = await runFastRecon({ username, urls, concurrency: 12, timeoutMs: 6000 });
          for (const r of results) {
            const id = platformIdFromUrl(r.url);
            write({ type: 'site_start', id });
            write({ type: 'site_result', id, status: r.status, url: r.url, latencyMs: r.latencyMs, heuristic: true });
            done += 1;
            write({ type: 'progress', done, total: urls.length });
          }
          write({ type: 'done', summary: { done, total: urls.length, elapsedMs: Date.now() - startAt } });
          controller.close();
          return;
        }

        // precise mode via engine (pattern/evidence-based)
        // Triage step: fast scan to select relevant platforms
        const urls = INFOOOZE_URLS.map(t => t.split('{username}').join(username));
        const triage = await runFastRecon({ username, urls, concurrency: 12, timeoutMs: 6000 });
        const relevant = new Set(
          triage
            .filter(r => r.status === 'found' || r.status === 'inconclusive')
            .map(r => platformIdFromUrl(r.url))
        );
        const candidateSites = CORE_SITES.filter(s => s.tier === tier && relevant.has(s.id));
        const iter = runScanWithSites(candidateSites, { username, concurrency: 6 });
        for await (const ev of iter) {
          write(ev);
        }
        controller.close();
      } catch (e) {
        write({ type: 'site_error', id: 'engine', reason: (e as any)?.message || 'error' });
        write({ type: 'done', summary: { done: 0, total: 0 } });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}

import { NextRequest } from 'next/server';
import { runScan } from '../../../lib/engine';

function sseSerialize(obj: any) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username') || '';
  const tier = (searchParams.get('tier') as 'fundamental' | 'core' | 'optional' | 'all') || 'fundamental';

  const stream = new ReadableStream({
    async start(controller) {
      const write = (obj: any) => controller.enqueue(new TextEncoder().encode(sseSerialize(obj)));
      try {
        if (!username) {
          write({ type: 'done', summary: { done: 0, total: 0 } });
          controller.close();
          return;
        }

        // precise mode via engine (pattern/evidence-based) on full curated set
        const iter = runScan({ username, tier, concurrency: 6 });
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

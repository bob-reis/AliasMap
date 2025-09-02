export const runtime = 'nodejs';

import { runScan } from '../../../lib/engine';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = (searchParams.get('username') || '').trim();
  const tier = (searchParams.get('tier') || 'fundamental') as 'fundamental' | 'core' | 'optional';

  if (!username) return new Response('username required', { status: 400 });

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (obj: any) => controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        for await (const evt of runScan({ username, tier, concurrency: 6 })) {
          send(evt);
        }
      } catch (e: any) {
        send({ type: 'error', message: e?.message || 'scan failed' });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}

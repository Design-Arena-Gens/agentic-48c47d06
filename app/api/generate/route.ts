import { NextRequest } from 'next/server';
import { z } from 'zod';
import { pollVeoOperation, submitVeoJob } from '@/lib/veo';

export const dynamic = 'force-dynamic';

const SubmitSchema = z.object({
  prompt: z.string().min(3),
  negativePrompt: z.string().optional(),
  aspectRatio: z.string().optional(),
  durationSeconds: z.number().int().min(1).max(60).optional(),
  fps: z.number().int().min(1).max(120).optional(),
  resolution: z.string().optional(),
  seed: z.number().int().optional()
});

const PollSchema = z.object({ operationName: z.string().min(3) });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Polling request
    const pollParsed = PollSchema.safeParse(body);
    if (pollParsed.success) {
      const { operationName } = pollParsed.data;
      const result = await pollVeoOperation(operationName);
      return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Submit job
    const parsed = SubmitSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten() }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const result = await submitVeoJob(parsed.data);

    // If we got a direct URL, return it. Else, poll up to ~2 minutes.
    if (result.videoUrl) {
      return new Response(JSON.stringify({ videoUrl: result.videoUrl, status: 'completed' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (result.operationName) {
      // Short immediate poll (up to ~30s) for quick jobs
      const start = Date.now();
      let lastStatus: string | undefined = result.status;
      while (Date.now() - start < 30000) {
        const polled = await pollVeoOperation(result.operationName);
        if (polled.videoUrl) {
          return new Response(JSON.stringify({ videoUrl: polled.videoUrl, status: 'completed' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        lastStatus = polled.status || lastStatus;
        await new Promise((r) => setTimeout(r, 3000));
      }
      return new Response(JSON.stringify({ operationName: result.operationName, status: lastStatus || 'processing' }), { status: 202, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ status: result.status || 'submitted' }), { status: 202, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

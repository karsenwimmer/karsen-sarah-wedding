import { keepSupabaseActive } from "@/lib/supabase-keepalive";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  try {
    await keepSupabaseActive();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Supabase keepalive failed.", {
      errorMessage: error instanceof Error ? error.message : "Unknown keepalive error"
    });

    return Response.json({ ok: false }, { status: 503 });
  }
}

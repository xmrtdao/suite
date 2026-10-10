import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

const CONN = Deno.env.get("DATABASE_URL") || "postgresql://postgres:postgres@localhost:5432/xmrt_suite";

const client = new Client(CONN);

async function listJobs() {
  await client.connect();
  try {
    const res = await client.queryObject(
      "SELECT id, name, schedule, command, enabled, created_at FROM cron.job ORDER BY id"
    );
    return { success: true, jobs: res.rows };
  } finally {
    await client.end();
  }
}

async function setEnabled(id: number, enabled: boolean) {
  await client.connect();
  try {
    await client.queryObject(
      "UPDATE cron.job SET enabled = $2 WHERE id = $1",
      [id, enabled]
    );
    return { success: true, id, enabled };
  } finally {
    await client.end();
  }
}

serve(async (req) => {
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  const action = body.action || url.searchParams.get("action") || "list";

  try {
    switch (action) {
      case "list":
        return Response.json(await listJobs());
      case "status": {
        const jobs = await listJobs();
        return Response.json({ success: true, enabled: jobs.jobs.filter(j => j.enabled).length, disabled: jobs.jobs.filter(j => !j.enabled).length });
      }
      case "enable":
      case "disable": {
        const id = Number(body.id);
        if (!id) return Response.json({ success: false, error: "id required" }, { status: 400 });
        return Response.json(await setEnabled(id, action === "enable"));
      }
      default:
        return Response.json({ success: false, error: "unknown action" }, { status: 400 });
    }
  } catch (e) {
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
});

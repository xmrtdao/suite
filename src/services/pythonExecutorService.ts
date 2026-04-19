// pythonExecutorService.ts

// This service is now responsible for invoking the Cloud Run endpoint
// specified by PISTON_URL for Python execution.

export async function executePython(
  code: string,
  stdin: string,
  args: string[],
  purpose: string,
  source: string,
): Promise<string> {
  const pistonUrl = process.env.PISTON_URL;

  if (!pistonUrl) {
    console.error("PISTON_URL environment variable is not set.");
    return "Error: Python execution service endpoint is not configured.";
  }

  try {
    const response = await fetch(pistonUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add any necessary authorization headers here if the Cloud Run service requires them
        // e.g., "Authorization": `Bearer ${process.env.CLOUD_RUN_AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        code,
        stdin,
        args,
        purpose,
        source,
        // Passing Supabase environment variables directly in the payload
        // for the Python runtime to access within Cloud Run.
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Cloud Run invocation error: ${response.status} ${response.statusText} - ${errorText}`,
      );
      return `Error: Python execution failed with status ${response.status}: ${errorText}`;
    }

    const data = await response.json(); // Assuming the Cloud Run endpoint returns JSON

    // The Cloud Run endpoint is expected to return a 'result' field
    // or the direct output if it's a simple string. Adjust based on actual API.
    return typeof data === "object" && "result" in data
      ? data.result
      : String(data);
  } catch (err) {
    console.error("Unexpected error during Python execution:", err);
    return `Error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

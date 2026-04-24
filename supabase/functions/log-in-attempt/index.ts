import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface LogPayload {
  email?: unknown;
  success?: unknown;
  failure_reason?: unknown;
  user_agent?: unknown;
  device_info?: unknown;
}

function sanitizeString(value: unknown, maxLen = 320): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, maxLen);
  return trimmed.length > 0 ? trimmed : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as LogPayload;

    const email = sanitizeString(body.email, 320);
    if (!email) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const success = body.success === true;
    const failure_reason = success ? null : sanitizeString(body.failure_reason, 200);
    const user_agent = sanitizeString(body.user_agent, 500);

    // Server-derived IP (client cannot spoof via this endpoint)
    const ip_address =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      null;

    // Constrain device_info to a small whitelist of string fields
    let device_info: Record<string, string> | null = null;
    if (body.device_info && typeof body.device_info === "object") {
      const di = body.device_info as Record<string, unknown>;
      device_info = {
        platform: sanitizeString(di.platform, 100) ?? "",
        language: sanitizeString(di.language, 20) ?? "",
        screen: sanitizeString(di.screen, 30) ?? "",
      };
    }

    // For successful logins, resolve user_id server-side from the auth token if provided.
    // We never trust a client-supplied user_id.
    let user_id: string | null = null;
    if (success) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace(/^Bearer\s+/i, "");
        const anonClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
        );
        const { data: userData } = await anonClient.auth.getUser(token);
        if (userData.user?.email?.toLowerCase() === email.toLowerCase()) {
          user_id = userData.user.id;
        }
      }
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await admin.from("login_audit").insert({
      email,
      success,
      user_id,
      user_agent,
      device_info,
      ip_address,
      failure_reason,
    });

    if (error) {
      console.error("Failed to insert login_audit:", error);
      return new Response(JSON.stringify({ error: "Insert failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("log-login-attempt error:", err);
    return new Response(JSON.stringify({ error: "Bad request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

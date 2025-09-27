// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { create, getNumericDate, Header, Payload } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().toLowerCase().replace(/^0x/, "");
  if (clean.length % 2 !== 0) throw new Error("Invalid hex length");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

async function getHmacKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("JWT_SECRET");
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  // Secret provided as hex string per instruction
  const secretBytes = /^[0-9a-fA-F]+$/.test(secret) ? hexToBytes(secret) : new TextEncoder().encode(secret);
  return await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"],
  );
}

type IssueJwtBody = {
  userData: any;
};

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
    }

    const { userData } = (await req.json()) as IssueJwtBody;
    if (!userData || typeof userData !== "object") {
      return new Response(JSON.stringify({ error: "Invalid body: userData is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    // Enriquecer userData con acciones por rol usando SERVICE ROLE (evita RLS)
    try {
      const url = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (url && serviceKey && Array.isArray(userData?.roles) && userData.roles.length > 0) {
        const s = createClient(url, serviceKey, { auth: { persistSession: false } });
        const roleIds: number[] = userData.roles.map((r: any) => r.id).filter((x: any) => Number.isFinite(x));
        if (roleIds.length > 0) {
          const { data, error } = await s
            .from('gen_roles_modulos')
            .select('rol_id, selected_actions_codes, selected_actions_codes')
            .in('rol_id', roleIds);
          if (!error && Array.isArray(data)) {
            const accionesPorRol: Record<string, string[]> = {};
            for (const row of data) {
              const codes: string[] = Array.isArray(row.selected_actions_codes)
                ? row.selected_actions_codes
                : (Array.isArray(row.selected_actions_codes) ? row.selected_actions_codes : []);
              accionesPorRol[String(row.rol_id)] = codes;
            }
            (userData as any).accionesPorRol = accionesPorRol;
            const set = new Set<string>();
            Object.values(accionesPorRol).forEach((arr) => (arr as string[]).forEach((c) => set.add(c)));
            (userData as any).acciones = Array.from(set);
          }
        }
      }
    } catch (_e) {
      // No bloquear emisión por fallo de enriquecimiento
    }

    const key = await getHmacKey();
    const header: Header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const exp = getNumericDate(60 * 60 * 8); // 8 hours

    // Standard claims + enriched userData
    const payload: Payload = {
      sub: String(userData.id ?? userData.userId ?? ""),
      iat: now,
      exp,
      ...userData,
    };

    const token = await create(header, payload, key);
    return new Response(JSON.stringify({ token }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});



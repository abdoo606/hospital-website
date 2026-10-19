import { createClient } from "@supabase/supabase-js";
import { cloudConfig } from "./cloud-config.js";
export const client = createClient(
  cloudConfig.url,
  cloudConfig.publishableKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storageKey: "portfolio-studio-auth-v1",
    },
  },
);
async function request(path, owner, body) {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session || data.session.user.id !== owner)
    throw Error("Sign in again to load this workspace.");
  // Freeze the token for this request; a subsequent account switch cannot
  // send an old user's draft under a newly signed-in user's identity.
  const token = data.session.access_token;
  const response = await fetch(cloudConfig.url + path, {
    method: body ? "POST" : "GET",
    headers: {
      apikey: cloudConfig.publishableKey,
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const json = await response.json();
  if (!response.ok) {
    const e = new Error("Cloud request failed.");
    e.code = json.code;
    throw e;
  }
  return json;
}
export const api = {
  async load(app, owner) {
    const rows = await request(
      "/rest/v1/portfolio_app_states?select=state,revision&app_id=eq." +
        encodeURIComponent(app),
      owner,
    );
    if (!Array.isArray(rows) || rows.length > 1)
      throw Error("Invalid workspace response.");
    return rows[0] || null;
  },
  async save(app, state, revision, owner) {
    const result = await request("/rest/v1/rpc/portfolio_save_state", owner, {
      p_app: app,
      p_state: state,
      p_expected_revision: revision,
    });
    return Array.isArray(result) ? result[0] : result;
  },
};

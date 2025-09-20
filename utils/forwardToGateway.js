const crypto = require("crypto");

// Optional HMAC signing
function signBody(secret, body) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body, "utf8");
  return hmac.digest("hex");
}

/**
 * Forward an event/command to the Gateway endpoint
 *
 * @param {Object} opts
 * @param {string} opts.gateway_id
 * @param {string} opts.event_type
 * @param {Object} opts.payload
 * @param {string} [opts.timestamp]
 * @param {string} [opts.gateway_url] Optional override for process.env.GATEWAY_URL
 * @returns {Promise<{ok: boolean, status: number, data: any}>}
 */
async function forwardToGateway({ gateway_id, event_type, payload, timestamp, gateway_url }) {
  const baseUrl = gateway_url || process.env.GATEWAY_URL;
  if (!baseUrl) throw new Error("GATEWAY_URL env var is required");

  const url = `${baseUrl.replace(/\/+$/, "")}/${encodeURIComponent(gateway_id)}/events`;

  const bodyObj = {
    gateway_id,
    event_type,
    payload,
    timestamp: timestamp || new Date().toISOString(),
  };
  const bodyStr = JSON.stringify(bodyObj);

  const headers = { "Content-Type": "application/json" };

  // Timeout via AbortController
  const ac = new AbortController();
  const timeoutMs = Number(process.env.GATEWAY_TIMEOUT_MS || 4000);
  const t = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: bodyStr,
      signal: ac.signal,
    });
    clearTimeout(t);

    const text = await res.text().catch(() => "");
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    clearTimeout(t);
    return {
      ok: false,
      status: 599, // pseudo “network/timeout” code
      data: { error: err.message || String(err) },
    };
  }
}

module.exports = { forwardToGateway };

const { getDbPool } = require("../../db");
const { forwardToGateway } = require("../../utils/forwardToGateway");

async function OtaUpdate(gateway_id, payload, timestamp, opts = {}) {
  const pool = await getDbPool();
  const createdAt = timestamp ? new Date(timestamp) : new Date();

  if (!payload?.url) {
    throw new Error("OTA update requires payload.url (firmware download URL)");
  }

  // 1) Insert into gateway_events
  const insert = `
    INSERT INTO gateway_events (gateway_id, event_type, event_data, created_at)
    VALUES ($1, 'cmd_ota_update', $2, $3)
    RETURNING *;
  `;
  const { rows } = await pool.query(insert, [
    gateway_id,
    payload,
    createdAt,
  ]);
  const eventRow = rows[0];

  // 2) Forward to Gateway
  const forwardRes = await forwardToGateway({
    gateway_id,
    event_type: "cmd_ota_update",
    payload,
    timestamp: createdAt.toISOString(),
    gateway_url: opts.gateway_url,
  });

  console.log(
    `[CMD] OtaUpdate → ${gateway_id}`,
    { url: payload.url, status: forwardRes.status, ok: forwardRes.ok }
  );

  return {
    event: eventRow,
    forward_result: forwardRes,
  };
}

module.exports = { OtaUpdate };

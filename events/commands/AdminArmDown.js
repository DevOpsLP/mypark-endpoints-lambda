const { getDbPool } = require("../../db");
const { forwardToGateway } = require("../../utils/forwardToGateway");

async function AdminArmDown(gateway_id, payload, timestamp, opts = {}) {
  const pool = await getDbPool();
  const createdAt = timestamp ? new Date(timestamp) : new Date();

  // 1) Insert into gateway_events
  const insert = `
    INSERT INTO gateway_events (gateway_id, event_type, event_data, created_at)
    VALUES ($1, 'cmd_admin_arm_down', $2, $3)
    RETURNING *;
  `;
  const { rows } = await pool.query(insert, [
    gateway_id,
    payload || {},
    createdAt,
  ]);
  const eventRow = rows[0];

  // 2) Forward command to Gateway
  const forwardRes = await forwardToGateway({
    gateway_id,
    event_type: "cmd_admin_arm_down",
    payload,
    timestamp: createdAt.toISOString(),
    gateway_url: opts.gateway_url,
  });

  console.log(
    `[CMD] AdminArmDown → ${gateway_id}`,
    { payload, status: forwardRes.status, ok: forwardRes.ok }
  );

  return {
    event: eventRow,
    forward_result: forwardRes,
  };
}

module.exports = { AdminArmDown };

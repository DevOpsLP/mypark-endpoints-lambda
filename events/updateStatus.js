const { getDbPool } = require("../db");

async function updateStatusEvent(gateway_id, payload, timestamp) {
  const pool = await getDbPool();
  const { status } = payload || {};

  if (!status) throw new Error("status is required");

  // Insert into log
  const insertEvent = `
    INSERT INTO gateway_events (gateway_id, event_type, event_data, created_at)
    VALUES ($1, 'update_status', $2, $3)
    RETURNING *;
  `;

  const { rows } = await pool.query(insertEvent, [
    gateway_id,
    { status },
    timestamp ? new Date(timestamp) : new Date(),
  ]);

  // Update gateway status
  await pool.query(
    `UPDATE gateways SET status = $1, updated_at = now() WHERE gateway_id = $2`,
    [status, gateway_id]
  );

  return rows[0];
}

module.exports = { updateStatusEvent };

const { getDbPool } = require("../../db");

async function UnitRemoval(gateway_id, payload, timestamp, opts = {}) {
  const pool = await getDbPool();

  const createdAt = timestamp ? new Date(timestamp) : new Date();

  // 1) Insert into gateway_events
  const insertSql = `
    INSERT INTO gateway_events (gateway_id, event_type, event_data, created_at)
    VALUES ($1, 'cmd_unit_removal', $2, $3)
    RETURNING *;
  `;
  const { rows } = await pool.query(insertSql, [
    gateway_id,
    payload || {},
    createdAt,
  ]);
  const eventRow = rows[0];

  // 2) Remove unit(s) linked to this gateway
  let removed = { rowCount: 0 };
  try {
    if (payload?.unit_address) {
      removed = await pool.query(
        `DELETE FROM units WHERE gateway_id = $1 AND unit_address = $2`,
        [gateway_id, payload.unit_address]
      );
    } else if (payload?.unit_mac) {
      removed = await pool.query(
        `DELETE FROM units WHERE gateway_id = $1 AND unit_mac = $2`,
        [gateway_id, payload.unit_mac]
      );
    } else {
      removed = await pool.query(
        `DELETE FROM units WHERE gateway_id = $1`,
        [gateway_id]
      );
    }
  } catch (err) {
    console.error(`[CMD] unit_removal DB error`, err);
  }

  console.log(
    `[CMD] unit_removal → ${gateway_id}`,
    payload,
    `removed: ${removed.rowCount}`
  );

  return {
    message: "Unit removal completed",
    event: eventRow,
    removed_count: removed.rowCount,
  };
}

module.exports = { UnitRemoval };
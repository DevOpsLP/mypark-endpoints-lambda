const { getDbPool } = require("../db");

// Import commands
const { LetMeIn } = require("./commands/LetMeIn");
const { AdminArmDown } = require("./commands/AdminArmDown");
const { AdminArmUp } = require("./commands/AdminArmUp");
const { ReportAll } = require("./commands/ReportAll");
const { OtaUpdate } = require("./commands/OtaUpdate");
const { UnitRemoval } = require("./commands/UnitRemoval");

// Side-effect for gateway status updates
async function onUpdateStatus(pool, gateway_id, payload) {
  const next = payload?.status;
  if (!next) throw new Error("payload.status is required for update_status");
  await pool.query(
    `UPDATE gateways
       SET status = $1, updated_at = now()
     WHERE gateway_id = $2`,
    [next, gateway_id]
  );
}

// Map event_type → handler
const SIDE_EFFECTS = {
  update_status: onUpdateStatus,

  // Commands
  cmd_let_me_in: LetMeIn,
  cmd_admin_arm_down: AdminArmDown,
  cmd_admin_arm_up: AdminArmUp,
  cmd_report_all: ReportAll,
  cmd_ota_update: OtaUpdate,
  cmd_unit_removal: UnitRemoval,
};

async function handleGatewayEvent(gateway_id, eventBody = {}) {
  if (!gateway_id) throw new Error("gateway_id is required");
  if (!eventBody.event_type) throw new Error("event_type is required");

  const pool = await getDbPool();
  const { event_type, payload = {}, timestamp, gateway_url } = eventBody;

  // ✅ Check gateway status before proceeding
  const statusRes = await pool.query(
    `SELECT status FROM gateways WHERE gateway_id = $1 LIMIT 1`,
    [gateway_id]
  );
  if (!statusRes.rows.length) {
    throw new Error(`Gateway ${gateway_id} not found`);
  }
  const { status } = statusRes.rows[0];
  if (status !== "active") {
    return {
      message: `gateway ${gateway_id} is not active (status=${status}), event ignored`,
    };
  }

  // Build created_at safely
  let createdAt = new Date();
  if (timestamp) {
    const t = new Date(timestamp);
    if (!isNaN(t.getTime())) createdAt = t;
  }

  // 1) Persist event log
  const insertSql = `
    INSERT INTO gateway_events (gateway_id, event_type, event_data, created_at)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const { rows } = await pool.query(insertSql, [
    gateway_id,
    event_type,
    payload,
    createdAt,
  ]);
  const eventRow = rows[0];

  // 2) Fire side-effects/commands
  const fn = SIDE_EFFECTS[event_type];
  if (fn) {
    try {
      await fn(gateway_id, payload, createdAt, { gateway_url });
    } catch (err) {
      console.error(`[SIDE_EFFECT ERROR] ${event_type}`, err.message);
    }
  }

  return {
    message: "event accepted",
    event: eventRow,
  };
}

module.exports = { handleGatewayEvent };

const { getDbPool } = require("./db");

async function registerGateway(eventBody) {
  const pool = await getDbPool();
  const { gateway_id, hardware_version, firmware_version, sim_imsi } = eventBody;

  const query = `
    INSERT INTO gateways (gateway_id, hardware_version, firmware_version, sim_imsi, status)
    VALUES ($1, $2, $3, $4, 'not-active')
    ON CONFLICT (gateway_id)
    DO UPDATE SET
      hardware_version = EXCLUDED.hardware_version,
      firmware_version = EXCLUDED.firmware_version,
      sim_imsi = EXCLUDED.sim_imsi,
      updated_at = now()
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    gateway_id,
    hardware_version,
    firmware_version,
    sim_imsi,
  ]);

  return rows[0];
}

module.exports = { registerGateway };

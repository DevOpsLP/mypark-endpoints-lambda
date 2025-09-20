const { getDbPool } = require("./db");

async function assignGateway(eventBody) {
  const pool = await getDbPool();
  const { gateway_id, section_id } = eventBody;

  const query = `
    INSERT INTO gateway_sections (gateway_id, section_id)
    VALUES ($1, $2)
    ON CONFLICT (gateway_id, section_id) DO NOTHING
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [gateway_id, section_id]);

  return rows[0] || { message: "Gateway already assigned" };
}

module.exports = { assignGateway };

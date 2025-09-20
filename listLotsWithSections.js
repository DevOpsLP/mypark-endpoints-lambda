const { getDbPool } = require("./db");

async function listLotsWithSections(queryParam) {
  const pool = await getDbPool();

  const sql = `
    SELECT 
      l.lot_id,
      l.lot_name,
      p.partner_id,
      p.property_name AS partner_name,
      s.section_id,
      s.name AS section_name
    FROM lots l
    JOIN partners p ON l.partner_id = p.partner_id
    JOIN sections s ON l.lot_id = s.lot_id
    WHERE ($1::text IS NULL OR l.lot_name ILIKE '%' || $1 || '%' OR s.name ILIKE '%' || $1 || '%')
    ORDER BY l.lot_id, s.section_id;
  `;

  const { rows } = await pool.query(sql, [queryParam || null]);

  // reshape into tree
  const lots = {};
  for (const row of rows) {
    if (!lots[row.lot_id]) {
      lots[row.lot_id] = {
        lot_id: row.lot_id,
        lot_name: row.lot_name,
        partner_id: row.partner_id,
        partner_name: row.partner_name,
        sections: []
      };
    }
    lots[row.lot_id].sections.push({
      section_id: row.section_id,
      section_name: row.section_name
    });
  }

  return Object.values(lots);
}

// Express-style handler
async function lotsHandler(req, res) {
  try {
    const q = req.query.q || null;
    const data = await listLotsWithSections(q);
    res.json(data);
  } catch (err) {
    console.error("Error fetching lots:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = { lotsHandler, listLotsWithSections };

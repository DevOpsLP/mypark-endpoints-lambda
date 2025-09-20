// utils/auth.js

async function verifyRegisterAuth(token) {
  const expected = process.env.REGISTER_TOKEN;
  if (!expected) throw new Error("REGISTER_TOKEN not configured");
  if (token !== expected) throw new Error("Invalid registration token");
  return true;
}

async function verifyGatewayAuth(token) {
  const expected = process.env.GATEWAY_TOKEN;
  if (!expected) throw new Error("GATEWAY_TOKEN not configured");
  if (!token) throw new Error("Missing Authorization token");
  if (token !== expected) throw new Error("Invalid gateway token");
  return true;
}

module.exports = { verifyRegisterAuth, verifyGatewayAuth };

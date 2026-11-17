const { registerGateway } = require("./registerGateway");
const { assignGateway } = require("./assignGateway");
const { listLotsWithSections } = require("./listLotsWithSections");
const { handleGatewayEvent } = require("./events/handler");
const { verifyRegisterAuth, verifyGatewayAuth } = require("./utils/auth");
const fs = require("fs");
const pathLib = require("path");

const handleRequest = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const path = event.rawPath || event.path || "/";
    const method =
      (event.requestContext && event.requestContext.http
        ? event.requestContext.http.method
        : event.httpMethod) || "GET";

    const authHeader = event.headers?.authorization || event.headers?.Authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    // Serve OpenAPI spec
    if (path.endsWith("/openapi.yaml") && method === "GET") {
      const specPath = pathLib.join(__dirname, "openapi.yaml");
      if (!fs.existsSync(specPath)) {
        return {
          statusCode: 404,
          body: "openapi.yaml not found in Lambda package",
        };
      }
      const yaml = fs.readFileSync(specPath, "utf8");
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "text/yaml; charset=utf-8",
          "Cache-Control": "public, max-age=60",
        },
        body: yaml,
      };
    }

    // Serve Scalar docs
    if (path.endsWith("/docs") && method === "GET") {
      const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Gateway Service API Docs</title>
    <link rel="icon" href="data:," />
  </head>
  <body>
    <script
      id="api-reference"
      data-url="./openapi.yaml"
      data-theme="kepler"
      src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest/dist/browser/standalone.min.js"
    ></script>
  </body>
</html>`;
      return {
        statusCode: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
        body: html,
      };
    }

    // Register
    if (path === "/gateway/register" && method === "POST") {
      await verifyRegisterAuth(token);
      const result = await registerGateway(body);
      return { statusCode: 200, body: JSON.stringify(result) };
    }

    // Assign
    if (path === "/gateway/assign" && method === "POST") {
      await verifyRegisterAuth(token);
      const result = await assignGateway(body);
      return { statusCode: 200, body: JSON.stringify(result) };
    }

    // Lookup
    if (path === "/lots" && method === "GET") {
      await verifyRegisterAuth(token);
      const q = (event.queryStringParameters || {}).q || null;
      const result = await listLotsWithSections(q);
      return { statusCode: 200, body: JSON.stringify(result) };
    }

    // Events → require shared gateway token
    if (path.startsWith("/gateway/") && path.endsWith("/events") && method === "POST") {
      const gateway_id = path.split("/")[2];
      await verifyGatewayAuth(token);
      const result = await handleGatewayEvent(gateway_id, body);
      return { statusCode: 200, body: JSON.stringify(result) };
    }

    return { statusCode: 404, body: JSON.stringify({ message: "Not Found", path, method }) };
  } catch (err) {
    console.error("Handler error:", err);
    const code = err instanceof SyntaxError ? 400 : /token|auth/i.test(err.message) ? 401 : 500;
    return { statusCode: code, body: JSON.stringify({ error: code === 400 ? "Invalid JSON" : code === 401 ? "Unauthorized" : "Internal Server Error" }) };
  }
};

exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin;
  const allowed = (process.env.ALLOWED_ORIGINS || "").split(",").map(x => x.trim()).filter(x => x && x !== "*");
  if (origin && !allowed.includes(origin)) {
    return { statusCode: 403, body: JSON.stringify({ error: "Origin not allowed" }) };
  }
  const headers = origin ? { "Access-Control-Allow-Origin": origin, "Vary": "Origin" } : {};
  const method = event.requestContext?.http?.method || event.httpMethod;
  if (method === "OPTIONS") {
    return { statusCode: 204, headers: { ...headers, "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Content-Type" }, body: "" };
  }
  const response = await handleRequest(event);
  return { ...response, headers: { ...response.headers, ...headers } };
};

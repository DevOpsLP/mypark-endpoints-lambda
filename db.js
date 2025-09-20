const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const { Pool } = require("pg");

let pool = null;

async function getDbPool() {
  if (pool) return pool;

  const secretsClient = new SecretsManagerClient({ region: "us-east-2" });
  const secretArn = process.env.DB_SECRET;

  const secret = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: secretArn })
  );

  if (!secret.SecretString) throw new Error("Secret not found");

  const creds = JSON.parse(secret.SecretString);

  pool = new Pool({
    host: creds.host,        
    user: creds.username,
    password: creds.password,
    database: creds.dbname,
    port: creds.port || 5432,
    ssl: { rejectUnauthorized: false },
  });

  return pool;
}

module.exports = { getDbPool };

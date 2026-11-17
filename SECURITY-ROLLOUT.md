# Local security patch — not deployed

Assignment and lot lookup now require REGISTER_TOKEN. Update server-side callers before deployment; never embed this token in browser code. Database TLS validates certificates; configure DB_CA_CERT with the appropriate trusted CA bundle if required. Gateway forwarding uses only the operator-configured HTTPS GATEWAY_URL and refuses redirects.

ALLOWED_ORIGINS is a comma-separated exact origin allowlist, with no wildcard. Empty means browser origins are denied. Configure the verified frontend origins for each environment. Remove wildcard CORS from Lambda Function URL/API Gateway infrastructure too; this repository contains no infrastructure configuration. CORS does not replace authentication.

Validate in staging with the real database CA and authorized callers. Run node --test security.test.js. Four regression tests pass. Dependencies were installed with scripts disabled using a local npm runtime; npm audit --omit=dev reported zero vulnerabilities on November 17, 2026.

Remaining: QR frontend/backend source and secret-provider access are required to remove browser credentials, introduce server-side authorization, rotate keys, invalidate old keys, and verify deployed assets. This patch is not evidence of rotation or production remediation. Gateway tokens remain shared; per-gateway identity and command authorization need a separate protocol migration. The repository has no production migration pipeline to gate. Review all remaining findings against the original security report.

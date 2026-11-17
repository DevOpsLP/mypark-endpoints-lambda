const { test } = require('node:test');
const assert = require('node:assert/strict');
// Block database access and device commands: these tests must have no live side effects.
for (const name of ['./registerGateway', './assignGateway', './listLotsWithSections', './events/handler']) {
  const id = require.resolve(name);
  require.cache[id] = { id, filename: id, loaded: true, exports: new Proxy({}, { get: () => () => { throw new Error('Unexpected backend access'); } }) };
}
const { handler } = require('./index');
const { forwardToGateway } = require('./utils/forwardToGateway');
test('assignment and lookup reject unauthenticated requests before database access', async () => {
  process.env.REGISTER_TOKEN = 'test-only';
  for (const [path, method] of [['/gateway/assign', 'POST'], ['/lots', 'GET']]) {
    assert.equal((await handler({ path, httpMethod: method })).statusCode, 401);
  }
});
test('CORS rejects wildcard and unknown origins, allows exact configured origin', async () => {
  process.env.ALLOWED_ORIGINS = 'https://trusted.example,*';
  assert.equal((await handler({ headers: { origin: 'https://untrusted.example' }, httpMethod: 'OPTIONS' })).statusCode, 403);
  const res = await handler({ headers: { origin: 'https://trusted.example' }, httpMethod: 'OPTIONS' });
  assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://trusted.example');
});
test('invalid JSON does not expose parser internals', async () => {
  const res = await handler({ body: '{', path: '/gateway/assign', httpMethod: 'POST' });
  assert.equal(res.statusCode, 400);
  assert.deepEqual(JSON.parse(res.body), { error: 'Invalid JSON' });
});
test('forwarding ignores caller URL and refuses redirects', async () => {
  process.env.GATEWAY_URL = 'https://configured.example';
  const original = global.fetch;
  global.fetch = async (url, opts) => {
    assert.equal(url, 'https://configured.example/gw/events');
    assert.equal(opts.redirect, 'error');
    return { ok: true, status: 200, text: async () => '{}' };
  };
  try { assert.equal((await forwardToGateway({ gateway_id: 'gw', gateway_url: 'http://169.254.169.254', payload: {} })).ok, true); }
  finally { global.fetch = original; }
});

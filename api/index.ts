import entry from '../dist/server/index.js';

export default async function handler(req: any, res: any) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'localhost';
  const url = new URL(req.url ?? '/', `${protocol}://${host}`);

  const request = new Request(url.toString(), {
    method: req.method,
    headers: req.headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req,
  });

  const response = await entry.default.fetch(request);

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (response.body) {
    const body = Buffer.from(await response.arrayBuffer());
    res.end(body);
  } else {
    res.end();
  }
}

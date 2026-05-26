const https = require('https');
const fs = require('fs');
const { spawn } = require('child_process');

const BINARY = '/tmp/cloudflared';
const DOWNLOAD_URL =
  'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64';

function download(url, dest, redirectCount) {
  redirectCount = redirectCount || 0;
  if (redirectCount > 5) {
    return Promise.reject(new Error('too many redirects'));
  }
  return new Promise(function (resolve, reject) {
    https.get(url, function (res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        download(res.headers.location, dest, redirectCount + 1).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error('HTTP ' + res.statusCode));
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', function () { file.close(function () { resolve(); }); });
      file.on('error', function (err) { fs.unlink(dest, function () {}); reject(err); });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function startTunnel() {
  const token = process.env.CLOUDFLARE_TUNNEL_TOKEN;
  if (!token) {
    console.log('[cloudflared] token not set, skipping');
    return;
  }

  if (!fs.existsSync(BINARY)) {
    console.log('[cloudflared] downloading binary...');
    await download(DOWNLOAD_URL, BINARY);
    console.log('[cloudflared] download ok');
  }

  fs.chmodSync(BINARY, 0o755);

  console.log('[cloudflared] starting tunnel');

  const proc = spawn(BINARY, ['tunnel', 'run', '--token', token], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  proc.stdout.on('data', function (d) {
    const line = d.toString().trim();
    if (line) console.log('[cloudflared]', line);
  });

  proc.stderr.on('data', function (d) {
    const line = d.toString().trim();
    if (line) console.log('[cloudflared]', line);
  });

  proc.on('spawn', function () {
    console.log('[cloudflared] started');
  });

  proc.on('error', function (err) {
    console.error('[cloudflared] spawn error:', err.message);
  });

  proc.on('close', function (code) {
    console.log('[cloudflared] exited code=' + code);
  });
}

module.exports = { startTunnel };

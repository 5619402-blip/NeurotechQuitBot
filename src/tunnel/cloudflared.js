const https = require('https');
const fs = require('fs');
const { spawn } = require('child_process');

const BINARY = '/tmp/cloudflared';
const DOWNLOAD_URL =
  'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64';
const TUNNEL_URL_REGEX = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;
const STARTUP_TIMEOUT_MS = 30000;

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
  if (!fs.existsSync(BINARY)) {
    console.log('[cloudflared] downloading binary...');
    await download(DOWNLOAD_URL, BINARY);
    console.log('[cloudflared] download ok');
  }

  fs.chmodSync(BINARY, 0o755);

  const token = process.env.CLOUDFLARE_TUNNEL_TOKEN;

  if (token) {
    // Named tunnel — публичный URL задаётся через BOTHOST_API_URL
    const namedUrl = process.env.BOTHOST_API_URL;
    if (!namedUrl) throw new Error('[tunnel] CLOUDFLARE_TUNNEL_TOKEN задан, но BOTHOST_API_URL не задан');
    const tokenPreview = token.slice(0, 6) + '...' + token.slice(-4);
    console.log('[tunnel] command: ' + BINARY + ' tunnel run --token ' + tokenPreview);
    console.log('[tunnel] starting cloudflared');
    const proc = spawn(BINARY, ['tunnel', 'run', '--token', token], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    console.log('[tunnel] process spawned pid=' + proc.pid);
    proc.stdout.on('data', function (d) {
      d.toString().split('\n').forEach(function (line) {
        if (line.trim()) console.log('[tunnel] stdout:', line.trim());
      });
    });
    proc.stderr.on('data', function (d) {
      d.toString().split('\n').forEach(function (line) {
        if (line.trim()) console.log('[tunnel] stderr:', line.trim());
      });
    });
    proc.on('error', function (err) {
      console.error('[tunnel] error:', err.message);
    });
    proc.on('exit', function (code, signal) {
      console.log('[tunnel] exited code=' + code + ' signal=' + signal);
    });
    proc.on('close', function (code, signal) {
      console.log('[tunnel] closed code=' + code + ' signal=' + signal);
    });
    return namedUrl;
  }

  // Quick Tunnel fallback — используется только при отсутствии CLOUDFLARE_TUNNEL_TOKEN
  console.log('[cloudflared] starting quick tunnel → http://localhost:3000');
  const proc = spawn(BINARY, ['tunnel', '--url', 'http://localhost:3000'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return new Promise(function (resolve, reject) {
    let resolved = false;

    const timer = setTimeout(function () {
      if (resolved) return;
      proc.kill();
      reject(new Error('[cloudflared] timeout: URL не получен за 30 секунд'));
    }, STARTUP_TIMEOUT_MS);

    function onLine(line) {
      if (!line.trim() || resolved) return;
      console.log('[cloudflared]', line.trim());
      const match = line.match(TUNNEL_URL_REGEX);
      if (match) {
        resolved = true;
        clearTimeout(timer);
        console.log('[cloudflared] public URL:', match[0]);
        resolve(match[0]);
      }
    }

    proc.stdout.on('data', function (d) { d.toString().split('\n').forEach(onLine); });
    proc.stderr.on('data', function (d) { d.toString().split('\n').forEach(onLine); });

    proc.on('error', function (err) {
      if (resolved) return;
      clearTimeout(timer);
      reject(new Error('[cloudflared] spawn error: ' + err.message));
    });

    proc.on('close', function (code) {
      if (resolved) return;
      clearTimeout(timer);
      reject(new Error('[cloudflared] process exited, code=' + code));
    });
  });
}

module.exports = { startTunnel };

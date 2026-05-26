const https = require('https');
const fs = require('fs');
const { spawn } = require('child_process');

const DOWNLOAD_URL =
  'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64';
const DEST = '/tmp/cloudflared';

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
      file.on('finish', function () {
        file.close(function () { resolve(); });
      });
      file.on('error', function (err) {
        fs.unlink(dest, function () {});
        reject(err);
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function run() {
  console.log('[cloudflared-check] downloading...');
  await download(DOWNLOAD_URL, DEST);
  console.log('[cloudflared-check] download ok');

  fs.chmodSync(DEST, 0o755);
  console.log('[cloudflared-check] chmod ok');

  await new Promise(function (resolve, reject) {
    const proc = spawn(DEST, ['--version']);
    let output = '';
    proc.stdout.on('data', function (d) { output += d.toString(); });
    proc.stderr.on('data', function (d) { output += d.toString(); });
    proc.on('close', function (code) {
      const version = output.trim();
      if (version) {
        console.log('[cloudflared-check] version: ' + version);
      } else {
        console.log('[cloudflared-check] exited code=' + code + ', no output');
      }
      resolve();
    });
    proc.on('error', reject);
  });
}

run().catch(function (err) {
  console.error('[cloudflared-check] error:', err.message);
});

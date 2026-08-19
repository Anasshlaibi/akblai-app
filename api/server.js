const path = require('path');
const fs = require('fs');
const { PHP } = require('@php-wasm/universal');
const { loadNodeRuntime, createNodeFsMountHandler } = require('@php-wasm/node');

let phpInstance = null;
let isMounted = false;

async function getPHP() {
  if (!phpInstance) {
    const runtimeId = await loadNodeRuntime('8.2', {
      emscriptenOptions: {
        processId: 1
      }
    });
    phpInstance = new PHP(runtimeId);
  }

  const rootDir = path.resolve(__dirname, '..');
  if (!isMounted) {
    try {
      await phpInstance.mount('/var/task', createNodeFsMountHandler(rootDir));
      isMounted = true;
    } catch (e) {
      // Mount already exists
    }
  }

  phpInstance.chdir('/var/task');
  return phpInstance;
}

const MIME_TYPES = {
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.json': 'application/json',
  '.html': 'text/html'
};

module.exports = async (req, res) => {
  try {
    const urlPath = (req.url || '/').split('?')[0];
    const rootDir = path.resolve(__dirname, '..');
    const localFilePath = path.join(rootDir, urlPath);

    // 1. Serve static non-PHP assets directly
    const ext = path.extname(urlPath).toLowerCase();
    if (ext && ext !== '.php' && fs.existsSync(localFilePath) && fs.statSync(localFilePath).isFile()) {
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const fileBuffer = fs.readFileSync(localFilePath);
      res.setHeader('Content-Type', contentType);
      return res.status(200).send(fileBuffer);
    }

    // 2. Determine target VFS script path
    let relativeScriptPath = urlPath;
    if (relativeScriptPath === '/' || relativeScriptPath === '') {
      relativeScriptPath = '/index.php';
    }

    let targetLocalScript = path.join(rootDir, relativeScriptPath);
    if (fs.existsSync(targetLocalScript) && fs.statSync(targetLocalScript).isDirectory()) {
      relativeScriptPath = path.join(relativeScriptPath, 'index.php');
      targetLocalScript = path.join(rootDir, relativeScriptPath);
    }

    if (!fs.existsSync(targetLocalScript)) {
      relativeScriptPath = '/index.php';
    }

    const vfsScriptPath = path.join('/var/task', relativeScriptPath).replace(/\\/g, '/');

    const php = await getPHP();
    const result = await php.run({
      scriptPath: vfsScriptPath,
      env: {
        VERCEL: '1',
        DOCUMENT_ROOT: '/var/task',
        SCRIPT_FILENAME: vfsScriptPath,
        HTTP_HOST: req.headers.host || 'akblai-app.vercel.app',
        REQUEST_URI: req.url || '/',
        REMOTE_ADDR: req.headers['x-forwarded-for'] || '127.0.0.1'
      }
    });

    const outputText = typeof result.text === 'string'
      ? result.text
      : Buffer.from(result.stdout || []).toString('utf-8');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(outputText);

  } catch (error) {
    console.error('PHP WASM Server Error:', error);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Dolibarr - Vercel PHP Engine Error</title></head>
      <body style="font-family:sans-serif; padding:40px; background:#f8d7da; color:#721c24;">
        <h2>Dolibarr PHP WASM Engine Execution Exception</h2>
        <p><strong>Error Message:</strong> ${error.message}</p>
        <pre>${error.stack}</pre>
      </body>
      </html>
    `);
  }
};

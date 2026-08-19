const path = require('path');
const fs = require('fs');
const { PHP } = require('@php-wasm/universal');
const { loadNodeRuntime } = require('@php-wasm/node');

let phpInstance = null;

async function getPHP() {
  if (!phpInstance) {
    const runtimeId = await loadNodeRuntime('8.2', {
      emscriptenOptions: {
        processId: 1
      }
    });
    phpInstance = new PHP(runtimeId);
  }
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
    const targetPath = path.join(__dirname, '..', urlPath);

    // Serve static non-PHP files directly if they exist
    const ext = path.extname(urlPath).toLowerCase();
    if (ext && ext !== '.php' && fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const fileBuffer = fs.readFileSync(targetPath);
      res.setHeader('Content-Type', contentType);
      return res.status(200).send(fileBuffer);
    }

    // Determine target PHP file
    let phpFilePath = targetPath;
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
      phpFilePath = path.join(targetPath, 'index.php');
    } else if (!phpFilePath.endsWith('.php')) {
      phpFilePath = path.join(__dirname, '..', 'index.php');
    }

    if (!fs.existsSync(phpFilePath)) {
      phpFilePath = path.join(__dirname, '..', 'index.php');
    }

    const phpCode = fs.readFileSync(phpFilePath, 'utf8');

    const php = await getPHP();
    const result = await php.run({
      code: phpCode,
      scriptPath: phpFilePath
    });

    const outputText = typeof result.text === 'string' 
      ? result.text 
      : Buffer.from(result.stdout || []).toString('utf-8');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(result.exitCode === 0 ? 200 : 500).send(outputText);

  } catch (error) {
    console.error('PHP WASM Error:', error);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Dolibarr - Temporary Vercel Error</title></head>
      <body style="font-family:sans-serif; padding:40px; background:#f8d7da; color:#721c24;">
        <h2>Dolibarr PHP WASM Engine Status</h2>
        <p><strong>Error Details:</strong> ${error.message}</p>
        <pre>${error.stack}</pre>
      </body>
      </html>
    `);
  }
};

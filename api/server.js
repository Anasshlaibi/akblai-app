const { loadPHP } = require('@php-wasm/node');
const path = require('path');

let phpInstance = null;

async function getPHP() {
  if (!phpInstance) {
    phpInstance = await loadPHP('8.2');
  }
  return phpInstance;
}

function parseOutput(output) {
  if (typeof output === 'string') return output;
  if (!output) return '';
  if (output instanceof Uint8Array || Buffer.isBuffer(output)) {
    return Buffer.from(output).toString('utf-8');
  }
  if (Array.isArray(output)) {
    return String.fromCharCode.apply(null, output);
  }
  return String(output);
}

module.exports = async (req, res) => {
  try {
    const php = await getPHP();
    const url = req.url || '/';
    const rootDir = path.resolve(__dirname, '..');
    
    let relPath = url.split('?')[0];
    if (relPath === '/' || relPath === '') {
        relPath = '/index.php';
    }
    const targetScript = path.join(rootDir, relPath);

    const response = await php.run({
      scriptPath: targetScript,
      requestHeaders: req.headers,
      method: req.method,
    });

    const rawOutput = parseOutput(response.stdout);

    // Separate CGI HTTP headers from HTML body
    let headersStr = '';
    let bodyText = rawOutput;
    
    const doubleNewlineIndex = rawOutput.indexOf('\r\n\r\n');
    if (doubleNewlineIndex !== -1) {
      headersStr = rawOutput.substring(0, doubleNewlineIndex);
      bodyText = rawOutput.substring(doubleNewlineIndex + 4);
    } else {
      const singleNewlineIndex = rawOutput.indexOf('\n\n');
      if (singleNewlineIndex !== -1) {
        headersStr = rawOutput.substring(0, singleNewlineIndex);
        bodyText = rawOutput.substring(singleNewlineIndex + 2);
      }
    }

    let contentTypeSet = false;
    let statusCode = 200;

    if (headersStr) {
      const lines = headersStr.split(/\r?\n/);
      for (const line of lines) {
        const parts = line.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim().toLowerCase();
          const val = parts.slice(1).join(':').trim();

          if (key === 'location') {
            res.writeHead(302, { Location: val });
            res.end();
            return;
          } else if (key === 'content-type') {
            res.setHeader('Content-Type', val);
            contentTypeSet = true;
          } else if (key === 'status') {
            const codeMatch = val.match(/^(\d{3})/);
            if (codeMatch) statusCode = parseInt(codeMatch[1], 10);
          } else {
            try {
              res.setHeader(parts[0].trim(), val);
            } catch (e) {}
          }
        }
      }
    }

    if (!contentTypeSet) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }

    res.statusCode = statusCode;
    res.end(bodyText);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html');
    res.end(`<h2>PHP WASM Bridge Error</h2><pre>${err.message}\n${err.stack}</pre>`);
  }
};

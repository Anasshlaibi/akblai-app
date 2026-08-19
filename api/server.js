const { loadPHP } = require('@php-wasm/node');
const path = require('path');

let phpInstance = null;

async function getPHP() {
  if (!phpInstance) {
    phpInstance = await loadPHP('8.2');
  }
  return phpInstance;
}

module.exports = async (req, res) => {
  try {
    const php = await getPHP();
    const url = req.url || '/';
    const rootDir = path.resolve(__dirname, '..');
    const targetScript = path.join(rootDir, url === '/' ? 'index.php' : url.split('?')[0]);

    const response = await php.run({
      scriptPath: targetScript,
      requestHeaders: req.headers,
      method: req.method,
    });

    let rawOutput = '';
    if (typeof response.stdout === 'string') {
      rawOutput = response.stdout;
    } else if (response.stdout) {
      rawOutput = Buffer.from(response.stdout).toString('utf-8');
    }

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

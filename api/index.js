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
    const targetScript = path.join(rootDir, url === '/' ? 'index.php' : url);

    const response = await php.run({
      scriptPath: targetScript,
      requestHeaders: req.headers,
      method: req.method,
    });

    res.statusCode = response.exitCode === 0 ? 200 : 500;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(response.stdout || response.stderr);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end(`PHP WASM Bridge Error:\n${err.message}\n\n${err.stack}`);
  }
};

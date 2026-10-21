import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';

const root = resolve('.');
const types = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf',
  '.mp4': 'video/mp4', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg'
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    const pathFromRoot = relative(root, file);
    if (pathFromRoot === '..' || pathFromRoot.startsWith(`..${sep}`) || !types[extname(file)]) {
      response.writeHead(404).end();
      return;
    }
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[extname(file)], 'Cache-Control': 'no-store' }).end(content);
  } catch {
    response.writeHead(404).end();
  }
}).listen(4173, '127.0.0.1', () => {
  console.log('Prévia VTR: http://127.0.0.1:4173/');
});

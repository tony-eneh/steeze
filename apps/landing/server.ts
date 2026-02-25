import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './src/main.server';

export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');
  const engine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);
  server.get('*.*', express.static(browserDistFolder, { maxAge: '1y' }));
  server.get('*', (req, res, next) => {
    engine.render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${req.protocol}://${req.headers.host}${req.originalUrl}`,
      publicPath: browserDistFolder,
      providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }]
    }).then((html) => res.send(html)).catch(next);
  });
  return server;
}

function run(): void {
  const port = Number(process.env['PORT'] || 4000);
  app().listen(port, () => console.log(`Landing SSR server listening on http://localhost:${port}`));
}

run();

const WebSocket = require('ws');
const http = require('http');

async function testResponsive() {
  const tabs = await new Promise((res, rej) => http.get('http://127.0.0.1:9222/json', r => {
    let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej));

  const page = tabs.find(t => t.type === 'page' && t.url.includes('3000'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  let msgId = 1;
  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      const handler = (data) => {
        const msg = JSON.parse(data);
        if (msg.id === id) {
          ws.off('message', handler);
          resolve(msg.result);
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const viewports = [
    { width: 375, height: 667, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1280, height: 800, name: 'Desktop' }
  ];

  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width < 1000
    });

    for (const p of ['blog.html', 'contact.html']) {
      await send('Page.navigate', { url: 'http://localhost:3000/' + p });
      await new Promise(r => setTimeout(r, 600));

      const overflow = await send('Runtime.evaluate', {
        expression: `({
          docWidth: document.documentElement.scrollWidth,
          winWidth: window.innerWidth,
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
          footerGridDisplay: window.getComputedStyle(document.querySelector('.footer-grid-4')).display,
          footerGridCols: window.getComputedStyle(document.querySelector('.footer-grid-4')).gridTemplateColumns
        })`,
        returnByValue: true
      });
      console.log(`${vp.name} (${vp.width}px) on ${p}:`, overflow.result.value);
    }
  }

  // Clear emulation
  await send('Emulation.clearDeviceMetricsOverride');
  ws.close();
}
testResponsive().catch(console.error);

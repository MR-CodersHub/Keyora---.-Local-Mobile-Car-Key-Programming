const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

async function test() {
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

  await send('Emulation.setDeviceMetricsOverride', {
    width: 360,
    height: 800,
    deviceScaleFactor: 1,
    mobile: true
  });

  await send('Page.navigate', { url: 'http://localhost:3000/index.html' });
  await new Promise(r => setTimeout(r, 1200));

  const topPos = await send('Runtime.evaluate', {
    expression: 'document.querySelector(".comparison-matrix-wrapper").getBoundingClientRect().top + window.scrollY'
  });
  console.log('Top pos:', topPos.result.value);

  await send('Runtime.evaluate', {
    expression: `window.scrollTo(0, ${topPos.result.value - 60});`
  });
  await new Promise(r => setTimeout(r, 500));

  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/dines/.gemini/antigravity-ide/brain/6b346db8-5530-4d47-a050-a1d382e2f05f/table_360_view.png', Buffer.from(ss.data, 'base64'));

  // Also scroll wrapper horizontally 300px and take screenshot
  await send('Runtime.evaluate', {
    expression: `document.querySelector(".comparison-matrix-wrapper").scrollLeft = 300;`
  });
  await new Promise(r => setTimeout(r, 400));
  const ssScrolled = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/dines/.gemini/antigravity-ide/brain/6b346db8-5530-4d47-a050-a1d382e2f05f/table_360_scrolled.png', Buffer.from(ssScrolled.data, 'base64'));

  await send('Emulation.clearDeviceMetricsOverride');
  ws.close();
}

test().catch(console.error);

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
  await new Promise(r => setTimeout(r, 1000));

  await send('Runtime.evaluate', {
    expression: `
      var el = document.querySelector('.comparison-matrix-wrapper');
      el.scrollIntoView({ behavior: 'instant', block: 'start' });
    `
  });
  await new Promise(r => setTimeout(r, 600));

  const pos = await send('Runtime.evaluate', {
    expression: `({
      scrollY: window.scrollY,
      rectTop: document.querySelector('.comparison-matrix-wrapper').getBoundingClientRect().top
    })`,
    returnByValue: true
  });
  console.log('Scroll result:', pos.result.value);

  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/dines/.gemini/antigravity-ide/brain/6b346db8-5530-4d47-a050-a1d382e2f05f/table_360_real.png', Buffer.from(ss.data, 'base64'));

  // Now scroll the table horizontally by 250px
  await send('Runtime.evaluate', {
    expression: `
      var el = document.querySelector('.comparison-matrix-wrapper');
      el.scrollLeft = 250;
    `
  });
  await new Promise(r => setTimeout(r, 400));
  const ss2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/dines/.gemini/antigravity-ide/brain/6b346db8-5530-4d47-a050-a1d382e2f05f/table_360_scrolled_real.png', Buffer.from(ss2.data, 'base64'));

  await send('Emulation.clearDeviceMetricsOverride');
  ws.close();
}

test().catch(console.error);

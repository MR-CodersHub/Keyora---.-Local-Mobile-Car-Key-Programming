const WebSocket = require('ws');
const http = require('http');

async function testWidths() {
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

  for (const w of [1200, 1024, 992, 900, 850, 768, 600, 480, 360]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false
    });
    await send('Page.navigate', { url: 'http://localhost:3000/index.html' });
    await new Promise(r => setTimeout(r, 600));

    const res = await send('Runtime.evaluate', {
      expression: `({
        width: window.innerWidth,
        navH: document.querySelector(".nav-menu").offsetHeight,
        navDisplay: window.getComputedStyle(document.querySelector(".nav-menu")).display,
        mobileToggleDisplay: window.getComputedStyle(document.querySelector(".mobile-toggle-btn")).display,
        overflow: document.documentElement.scrollWidth > window.innerWidth
      })`,
      returnByValue: true
    });
    console.log(w + 'px:', res.result.value);
  }

  await send('Emulation.clearDeviceMetricsOverride');
  ws.close();
}

testWidths().catch(console.error);

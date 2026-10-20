const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

async function testPages1024() {
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
    width: 1024,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false
  });

  const pages = ['blog-details.html', 'about.html', 'services.html', 'pricing.html', 'blog.html', 'contact.html', 'home-2.html', 'index.html'];

  for (const p of pages) {
    await send('Page.navigate', { url: 'http://localhost:3000/' + p });
    await new Promise(r => setTimeout(r, 600));

    const res = await send('Runtime.evaluate', {
      expression: `({
        page: "${p}",
        navMenuH: document.querySelector(".nav-menu") ? document.querySelector(".nav-menu").offsetHeight : null,
        navMenuW: document.querySelector(".nav-menu") ? document.querySelector(".nav-menu").offsetWidth : null,
        headerH: document.querySelector(".main-header") ? document.querySelector(".main-header").offsetHeight : null,
        callBtnInNav: !!document.querySelector(".nav-menu #navCallBtn, .nav-menu .btn-call-now"),
        callBtnInActions: !!document.querySelector(".header-actions #headerCallBtn, .header-actions .btn-call-now"),
        hasWrap: document.querySelector(".nav-menu") && document.querySelector(".nav-menu").offsetHeight > 45,
        overflow: document.documentElement.scrollWidth > window.innerWidth
      })`,
      returnByValue: true
    });
    console.log(res.result.value);
  }

  await send('Emulation.clearDeviceMetricsOverride');
  ws.close();
}

testPages1024().catch(console.error);

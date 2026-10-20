const WebSocket = require('ws');
const http = require('http');

async function checkElements() {
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

  const res = await send('Runtime.evaluate', {
    expression: `Array.from(document.querySelectorAll(".comparison-matrix-wrapper *")).filter(el => el.scrollWidth > 680).map(el => ({
      tag: el.tagName,
      cls: el.className,
      text: el.textContent.substring(0, 40).replace(/\\s+/g, ' '),
      scrollWidth: el.scrollWidth,
      offsetWidth: el.offsetWidth
    }))`,
    returnByValue: true
  });
  console.log(res.result.value);

  // Also check why ribbon is overflowing
  const ribbonInfo = await send('Runtime.evaluate', {
    expression: `(function() {
      var ribbon = document.querySelector(".comparison-matrix-header-ribbon");
      var left = document.querySelector(".matrix-ribbon-left");
      var right = document.querySelector(".matrix-ribbon-right");
      return {
        ribbon: { scrollWidth: ribbon.scrollWidth, offsetWidth: ribbon.offsetWidth },
        left: { scrollWidth: left.scrollWidth, offsetWidth: left.offsetWidth },
        right: { scrollWidth: right.scrollWidth, offsetWidth: right.offsetWidth }
      };
    })()`,
    returnByValue: true
  });
  console.log('Ribbon info:', ribbonInfo.result.value);

  await send('Emulation.clearDeviceMetricsOverride');
  ws.close();
}
checkElements().catch(console.error);

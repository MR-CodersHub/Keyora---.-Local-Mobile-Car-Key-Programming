const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

async function testFullScroll() {
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
    expression: `document.querySelector(".comparison-matrix-wrapper").scrollIntoView({ behavior: "instant", block: "start" });`
  });
  await new Promise(r => setTimeout(r, 400));

  // Scroll all the way to max right
  await send('Runtime.evaluate', {
    expression: `var el = document.querySelector(".comparison-matrix-wrapper"); el.scrollLeft = el.scrollWidth;`
  });
  await new Promise(r => setTimeout(r, 400));

  const scrollInfo = await send('Runtime.evaluate', {
    expression: `(function() {
      var el = document.querySelector(".comparison-matrix-wrapper");
      var tbl = document.querySelector(".comparison-table");
      var rbn = document.querySelector(".comparison-matrix-header-ribbon");
      return {
        scrollLeft: el.scrollLeft,
        maxScroll: el.scrollWidth - el.clientWidth,
        wrapperScrollWidth: el.scrollWidth,
        wrapperOffsetWidth: el.offsetWidth,
        tableWidth: tbl ? tbl.offsetWidth : null,
        ribbonWidth: rbn ? rbn.offsetWidth : null
      };
    })()`,
    returnByValue: true
  });
  console.log(scrollInfo.result.value);

  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/dines/.gemini/antigravity-ide/brain/6b346db8-5530-4d47-a050-a1d382e2f05f/table_360_max_right.png', Buffer.from(ss.data, 'base64'));

  await send('Emulation.clearDeviceMetricsOverride');
  ws.close();
}

testFullScroll().catch(console.error);

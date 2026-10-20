const WebSocket = require('ws');
const http = require('http');

async function testTable() {
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
  await new Promise(r => setTimeout(r, 800));

  const info = await send('Runtime.evaluate', {
    expression: `
      (function() {
        var wrapper = document.querySelector('.comparison-matrix-wrapper');
        var table = document.querySelector('.comparison-table');
        var ribbon = document.querySelector('.comparison-matrix-header-ribbon');
        var section = wrapper ? wrapper.closest('section') : null;
        var overflowingElements = [];
        document.querySelectorAll('*').forEach(function(el) {
          if (el.scrollWidth > window.innerWidth + 2 && el !== document.documentElement && el !== document.body) {
            overflowingElements.push({
              tag: el.tagName,
              cls: el.className,
              scrollWidth: el.scrollWidth,
              offsetWidth: el.offsetWidth
            });
          }
        });

        return {
          windowWidth: window.innerWidth,
          docScrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          wrapper: wrapper ? {
            scrollWidth: wrapper.scrollWidth,
            offsetWidth: wrapper.offsetWidth,
            clientWidth: wrapper.clientWidth,
            overflowX: window.getComputedStyle(wrapper).overflowX,
            maxWidth: window.getComputedStyle(wrapper).maxWidth
          } : null,
          ribbon: ribbon ? {
            scrollWidth: ribbon.scrollWidth,
            offsetWidth: ribbon.offsetWidth,
            minWidth: window.getComputedStyle(ribbon).minWidth
          } : null,
          table: table ? {
            scrollWidth: table.scrollWidth,
            offsetWidth: table.offsetWidth,
            minWidth: window.getComputedStyle(table).minWidth,
            tableLayout: window.getComputedStyle(table).tableLayout
          } : null,
          overflowingCount: overflowingElements.length,
          topOverflowing: overflowingElements.slice(0, 10)
        };
      })()
    `,
    returnByValue: true
  });

  console.log(JSON.stringify(info.result.value, null, 2));

  await send('Emulation.clearDeviceMetricsOverride');
  ws.close();
}

testTable().catch(console.error);

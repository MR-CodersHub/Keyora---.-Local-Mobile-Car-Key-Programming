const WebSocket = require('ws');
const http = require('http');

async function checkAlignment() {
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

  for (const p of ['blog.html', 'contact.html']) {
    await send('Page.navigate', { url: 'http://localhost:3000/' + p });
    await new Promise(r => setTimeout(r, 600));

    const evalRes = await send('Runtime.evaluate', {
      expression: `
        (function() {
          var containers = Array.from(document.querySelectorAll('.container')).map(function(c) {
            var rect = c.getBoundingClientRect();
            var parent = c.parentElement;
            return {
              parentTag: parent.tagName,
              parentClass: parent.className,
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width)
            };
          });
          return containers;
        })()
      `,
      returnByValue: true
    });
    console.log(`=== Containers in ${p} ===`);
    console.table(evalRes.result.value);
  }

  ws.close();
}
checkAlignment().catch(console.error);

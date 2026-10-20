const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

async function snap() {
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

  const destDir = 'C:/Users/dines/.gemini/antigravity-ide/brain/6b346db8-5530-4d47-a050-a1d382e2f05f';

  for (const p of ['blog.html', 'contact.html']) {
    await send('Page.navigate', { url: 'http://localhost:3000/' + p });
    await new Promise(r => setTimeout(r, 600));

    await send('Runtime.evaluate', {
      expression: `document.documentElement.setAttribute('data-theme', 'light'); document.querySelector('footer').scrollIntoView();`
    });
    await new Promise(r => setTimeout(r, 400));
    const ssL = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(destDir + '/' + p.replace('.html', '_footer_light.png'), Buffer.from(ssL.data, 'base64'));

    await send('Runtime.evaluate', {
      expression: `document.documentElement.setAttribute('data-theme', 'dark'); document.querySelector('footer').scrollIntoView();`
    });
    await new Promise(r => setTimeout(r, 400));
    const ssD = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(destDir + '/' + p.replace('.html', '_footer_dark.png'), Buffer.from(ssD.data, 'base64'));
  }

  ws.close();
  console.log('Screenshots saved successfully');
}
snap().catch(console.error);

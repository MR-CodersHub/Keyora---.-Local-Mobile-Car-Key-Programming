const WebSocket = require('ws');
const http = require('http');

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

  for (const pageName of ['blog.html', 'contact.html', 'pricing.html', 'index.html']) {
    await send('Page.navigate', { url: 'http://localhost:3000/' + pageName });
    await new Promise(r => setTimeout(r, 600));
    const expr = `
      (function() {
        var f = document.querySelector('footer');
        var cont = f ? f.querySelector('.container') : null;
        var bRow = f ? f.querySelector('.footer-bottom-row') : null;
        var grid = f ? f.querySelector('.footer-grid-4') : null;
        var links = bRow ? Array.from(bRow.querySelectorAll('a')).map(function(a) {
          return { text: a.textContent.trim(), href: a.getAttribute('href'), color: window.getComputedStyle(a).color };
        }) : [];
        var brandLogo = f ? (f.querySelector('.brand-logo-img') ? f.querySelector('.brand-logo-img').parentElement.tagName : null) : null;
        var brandHref = f && f.querySelector('.brand-logo-img') && f.querySelector('.brand-logo-img').closest('a') ? f.querySelector('.brand-logo-img').closest('a').getAttribute('href') : null;
        var headerCallBtn = document.querySelector('#navCallBtn') || document.querySelector('#headerCallBtn') || document.querySelector('.btn-call-now');
        return {
          page: location.pathname,
          footerClasses: f ? f.className : null,
          footerBg: f ? window.getComputedStyle(f).backgroundColor : null,
          containerPadding: cont ? window.getComputedStyle(cont).padding : null,
          containerWidth: cont ? cont.offsetWidth : null,
          brandLogoParentTag: brandLogo,
          brandHref: brandHref,
          headerCallHref: headerCallBtn ? headerCallBtn.getAttribute('href') : null
        };
      })()
    `;
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true
    });
    console.log(JSON.stringify(res.result.value, null, 2));
  }
  ws.close();
}
test().catch(console.error);

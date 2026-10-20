const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

async function testCtaUpdate() {
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

  console.log('Testing at 1024px viewport...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1024,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false
  });

  await send('Page.navigate', { url: 'http://localhost:3000/index.html' });
  await new Promise(r => setTimeout(r, 800));

  const info = await send('Runtime.evaluate', {
    expression: `
      (function() {
        var header = document.querySelector('.main-header');
        var navMenu = document.querySelector('.nav-menu');
        var headerActions = document.querySelector('.header-actions');
        var ctaBtn = document.querySelector('#headerCtaBtn');
        var themeBtn = document.querySelector('#themeToggleBtn');
        var rtlBtn = document.querySelector('#rtlToggleBtn');
        var heroActions = document.querySelector('.hero-actions');
        var heroBtns = Array.from(heroActions.querySelectorAll('a')).map(function(a) {
          var r = a.getBoundingClientRect();
          return { text: a.textContent.trim(), href: a.getAttribute('href'), top: r.top, left: r.left, width: r.width, height: r.height };
        });

        var ctaRect = ctaBtn ? ctaBtn.getBoundingClientRect() : null;
        var themeRect = themeBtn ? themeBtn.getBoundingClientRect() : null;
        var rtlRect = rtlBtn ? rtlBtn.getBoundingClientRect() : null;
        var actionsRect = headerActions ? headerActions.getBoundingClientRect() : null;

        return {
          windowWidth: window.innerWidth,
          navMenuHeight: navMenu ? navMenu.offsetHeight : null,
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
          headerActions: {
            themeBtn: themeRect ? { top: Math.round(themeRect.top), left: Math.round(themeRect.left), width: Math.round(themeRect.width), height: Math.round(themeRect.height) } : null,
            rtlBtn: rtlRect ? { top: Math.round(rtlRect.top), left: Math.round(rtlRect.left), width: Math.round(rtlRect.width), height: Math.round(rtlRect.height) } : null,
            ctaBtn: ctaRect ? { text: ctaBtn.textContent.trim(), href: ctaBtn.getAttribute('href'), top: Math.round(ctaRect.top), left: Math.round(ctaRect.left), width: Math.round(ctaRect.width), height: Math.round(ctaRect.height) } : null,
            isCtaLast: ctaRect && rtlRect && ctaRect.left > rtlRect.left
          },
          heroButtons: heroBtns
        };
      })()
    `,
    returnByValue: true
  });

  console.log('1024px Inspection Result:');
  console.log(JSON.stringify(info.result.value, null, 2));

  // Capture screenshot of the updated header and hero
  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/dines/.gemini/antigravity-ide/brain/6b346db8-5530-4d47-a050-a1d382e2f05f/header_cta_last.png', Buffer.from(ss.data, 'base64'));

  await send('Emulation.clearDeviceMetricsOverride');
  ws.close();
}

testCtaUpdate().catch(console.error);

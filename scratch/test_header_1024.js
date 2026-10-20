const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

async function testHeader1024() {
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

  await send('Page.navigate', { url: 'http://localhost:3000/index.html' });
  await new Promise(r => setTimeout(r, 1000));

  const headerInfo = await send('Runtime.evaluate', {
    expression: `
      (function() {
        var header = document.querySelector('.main-header');
        var navContainer = document.querySelector('.nav-container');
        var logo = document.querySelector('.main-header .brand-logo');
        var navMenu = document.querySelector('.nav-menu');
        var headerActions = document.querySelector('.header-actions');
        var mobileToggle = document.querySelector('.mobile-toggle-btn');
        var navLinks = Array.from(document.querySelectorAll('.nav-menu .nav-link')).map(function(a) {
          var r = a.getBoundingClientRect();
          return { text: a.textContent.trim(), top: r.top, left: r.left, width: r.width, height: r.height };
        });
        var callBtn = document.querySelector('#navCallBtn') || document.querySelector('#headerCallBtn');
        var callRect = callBtn ? callBtn.getBoundingClientRect() : null;
        var themeBtn = document.querySelector('#themeToggleBtn');
        var themeRect = themeBtn ? themeBtn.getBoundingClientRect() : null;
        var rtlBtn = document.querySelector('#rtlToggleBtn');
        var rtlRect = rtlBtn ? rtlBtn.getBoundingClientRect() : null;

        return {
          windowWidth: window.innerWidth,
          navContainerWidth: navContainer ? navContainer.offsetWidth : null,
          logoWidth: logo ? logo.offsetWidth : null,
          navMenuDisplay: navMenu ? window.getComputedStyle(navMenu).display : null,
          navMenuWidth: navMenu ? navMenu.offsetWidth : null,
          navMenuHeight: navMenu ? navMenu.offsetHeight : null,
          headerActionsDisplay: headerActions ? window.getComputedStyle(headerActions).display : null,
          headerActionsWidth: headerActions ? headerActions.offsetWidth : null,
          mobileToggleDisplay: mobileToggle ? window.getComputedStyle(mobileToggle).display : null,
          navLinks: navLinks,
          callBtn: callBtn ? { top: callRect.top, left: callRect.left, width: callRect.width, height: callRect.height } : null,
          themeBtn: themeBtn ? { top: themeRect.top, left: themeRect.left, width: themeRect.width, height: themeRect.height } : null,
          rtlBtn: rtlBtn ? { top: rtlRect.top, left: rtlRect.left, width: rtlRect.width, height: rtlRect.height } : null
        };
      })()
    `,
    returnByValue: true
  });

  console.log(JSON.stringify(headerInfo.result.value, null, 2));

  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/dines/.gemini/antigravity-ide/brain/6b346db8-5530-4d47-a050-a1d382e2f05f/header_1024.png', Buffer.from(ss.data, 'base64'));

  await send('Emulation.clearDeviceMetricsOverride');
  ws.close();
}

testHeader1024().catch(console.error);

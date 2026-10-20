const WebSocket = require('ws');
const http = require('http');

async function main() {
  const tabs = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });

  const page = tabs.find(t => t.type === 'page' && t.url.includes('3000'));
  if (!page) {
    console.log('No page found on 3000');
    return;
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(res => ws.on('open', res));

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

  // Navigate to contact.html
  await send('Page.navigate', { url: 'http://localhost:3000/contact.html' });
  await new Promise(r => setTimeout(r, 1200));

  const contactEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const footer = document.querySelector('footer');
      const cs = window.getComputedStyle(footer);
      const grid = document.querySelector('.footer-grid-4');
      const gridCs = grid ? window.getComputedStyle(grid) : {};
      const cols = Array.from(document.querySelectorAll('.footer-col')).map(c => ({
        width: c.offsetWidth,
        h4: c.querySelector('h4') ? window.getComputedStyle(c.querySelector('h4')).color : null
      }));
      const links = Array.from(document.querySelectorAll('.footer-links-list a')).slice(0, 3).map(a => window.getComputedStyle(a).color);
      const aboutText = document.querySelector('.footer-about-text') ? window.getComputedStyle(document.querySelector('.footer-about-text')).color : null;
      const bottomRow = document.querySelector('.footer-bottom-row') ? window.getComputedStyle(document.querySelector('.footer-bottom-row')).color : null;
      const hotlineBox = document.querySelector('.footer-hotline-box') ? {
        bg: window.getComputedStyle(document.querySelector('.footer-hotline-box')).backgroundColor,
        border: window.getComputedStyle(document.querySelector('.footer-hotline-box')).borderColor
      } : null;

      return {
        theme: document.documentElement.getAttribute('data-theme'),
        footerBg: cs.backgroundColor,
        footerPadding: cs.padding,
        gridTemplateColumns: gridCs.gridTemplateColumns,
        gap: gridCs.gap,
        cols,
        links,
        aboutText,
        bottomRow,
        hotlineBox
      };
    })()`,
    returnByValue: true
  });

  console.log('Contact Page (Light mode):', JSON.stringify(contactEval.result.value, null, 2));

  // Toggle dark mode
  await send('Runtime.evaluate', {
    expression: `document.documentElement.setAttribute('data-theme', 'dark')`
  });
  await new Promise(r => setTimeout(r, 400));

  const contactDarkEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const footer = document.querySelector('footer');
      const cs = window.getComputedStyle(footer);
      const aboutText = document.querySelector('.footer-about-text') ? window.getComputedStyle(document.querySelector('.footer-about-text')).color : null;
      const bottomRow = document.querySelector('.footer-bottom-row') ? window.getComputedStyle(document.querySelector('.footer-bottom-row')).color : null;
      const links = Array.from(document.querySelectorAll('.footer-links-list a')).slice(0, 3).map(a => window.getComputedStyle(a).color);
      return {
        theme: document.documentElement.getAttribute('data-theme'),
        footerBg: cs.backgroundColor,
        aboutText,
        links,
        bottomRow
      };
    })()`,
    returnByValue: true
  });

  console.log('Contact Page (Dark mode):', JSON.stringify(contactDarkEval.result.value, null, 2));

  ws.close();
}

main().catch(console.error);

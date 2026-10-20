const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

async function verify() {
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

  const pagesToTest = ['blog.html', 'contact.html', 'pricing.html', 'index.html'];

  for (const pageName of pagesToTest) {
    console.log(`\n=== Testing ${pageName} ===`);
    // Navigate and wait
    await send('Page.navigate', { url: 'http://localhost:3000/' + pageName });
    await new Promise(r => setTimeout(r, 800));

    // 1. Check Light Mode Footer Styles & Header Call Href
    const lightCheck = await send('Runtime.evaluate', {
      expression: `
        (function() {
          document.documentElement.setAttribute('data-theme', 'light');
          var footer = document.querySelector('footer');
          var fCs = window.getComputedStyle(footer);
          var brandLink = footer ? footer.querySelector('.footer-brand-link') : null;
          var brandImg = footer ? footer.querySelector('.brand-logo-img') : null;
          var brandHref = brandLink ? brandLink.getAttribute('href') : null;
          var headerCall = document.querySelector('#navCallBtn') || document.querySelector('#headerCallBtn') || document.querySelector('.btn-call-now');
          var aboutText = footer ? footer.querySelector('.footer-about-text') : null;
          var aboutColor = aboutText ? window.getComputedStyle(aboutText).color : null;
          var firstLink = footer ? footer.querySelector('.footer-links-list a') : null;
          var linkColor = firstLink ? window.getComputedStyle(firstLink).color : null;
          var bottomRow = footer ? footer.querySelector('.footer-bottom-row') : null;
          var bottomColor = bottomRow ? window.getComputedStyle(bottomRow).color : null;
          var h4 = footer ? footer.querySelector('h4') : null;
          var h4Color = h4 ? window.getComputedStyle(h4).color : null;
          var hotline = footer ? footer.querySelector('.footer-hotline-box a') : null;
          var hotlineHref = hotline ? hotline.getAttribute('href') : null;
          var hotlineColor = hotline ? window.getComputedStyle(hotline).color : null;
          var grid = footer ? footer.querySelector('.footer-grid-4') : null;
          var gridCs = grid ? window.getComputedStyle(grid) : {};

          return {
            mode: 'light',
            footerBg: fCs.backgroundColor,
            h4Color: h4Color,
            aboutColor: aboutColor,
            linkColor: linkColor,
            bottomColor: bottomColor,
            hotlineColor: hotlineColor,
            hotlineHref: hotlineHref,
            headerCallHref: headerCall ? headerCall.getAttribute('href') : null,
            brandHref: brandHref,
            brandTag: brandLink ? brandLink.tagName : null,
            gridColumns: gridCs.gridTemplateColumns,
            gridGap: gridCs.gap
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Light Mode:', JSON.stringify(lightCheck.result.value, null, 2));

    // Capture Light Mode footer screenshot
    await send('Runtime.evaluate', {
      expression: `window.scrollTo(0, document.body.scrollHeight);`
    });
    await new Promise(r => setTimeout(r, 400));
    const ssLight = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`scratch/${pageName.replace('.html', '')}_footer_light.png`, Buffer.from(ssLight.data, 'base64'));

    // 2. Check Dark Mode Footer Styles
    const darkCheck = await send('Runtime.evaluate', {
      expression: `
        (function() {
          document.documentElement.setAttribute('data-theme', 'dark');
          var footer = document.querySelector('footer');
          var fCs = window.getComputedStyle(footer);
          var aboutText = footer ? footer.querySelector('.footer-about-text') : null;
          var firstLink = footer ? footer.querySelector('.footer-links-list a') : null;
          var bottomRow = footer ? footer.querySelector('.footer-bottom-row') : null;
          var h4 = footer ? footer.querySelector('h4') : null;
          var hotline = footer ? footer.querySelector('.footer-hotline-box a') : null;

          return {
            mode: 'dark',
            footerBg: fCs.backgroundColor,
            h4Color: h4 ? window.getComputedStyle(h4).color : null,
            aboutColor: aboutText ? window.getComputedStyle(aboutText).color : null,
            linkColor: firstLink ? window.getComputedStyle(firstLink).color : null,
            bottomColor: bottomRow ? window.getComputedStyle(bottomRow).color : null,
            hotlineColor: hotline ? window.getComputedStyle(hotline).color : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Dark Mode:', JSON.stringify(darkCheck.result.value, null, 2));

    // Capture Dark Mode footer screenshot
    const ssDark = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`scratch/${pageName.replace('.html', '')}_footer_dark.png`, Buffer.from(ssDark.data, 'base64'));

    // Reset back to light
    await send('Runtime.evaluate', {
      expression: `document.documentElement.setAttribute('data-theme', 'light');`
    });
  }

  // 3. Test Clicking Footer Brand Logo Link on Contact page
  console.log('\n=== Testing Footer Brand Link Click on Contact Page ===');
  await send('Page.navigate', { url: 'http://localhost:3000/contact.html' });
  await new Promise(r => setTimeout(r, 800));

  await send('Runtime.evaluate', {
    expression: `
      (function() {
        var brandLink = document.querySelector('.footer-brand-link');
        if (brandLink) {
          brandLink.click();
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1000));

  const clickResult = await send('Runtime.evaluate', {
    expression: `location.pathname`,
    returnByValue: true
  });
  console.log('Navigated to after footer brand click:', clickResult.result.value);

  ws.close();
}

verify().catch(console.error);

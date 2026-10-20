const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

async function testFinal() {
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

  console.log('===================================================================');
  console.log('TEST 1: Homepage 1 Comparison Table at 360px viewport');
  console.log('===================================================================');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 360,
    height: 740,
    deviceScaleFactor: 2,
    mobile: true
  });

  await send('Page.navigate', { url: 'http://localhost:3000/index.html' });
  await new Promise(r => setTimeout(r, 1000));

  const tableTest = await send('Runtime.evaluate', {
    expression: `
      (function() {
        var wrapper = document.querySelector('.comparison-matrix-wrapper');
        var table = document.querySelector('.comparison-table');
        var ribbon = document.querySelector('.comparison-matrix-header-ribbon');
        var docWidth = document.documentElement.scrollWidth;
        var winWidth = window.innerWidth;
        var cols = Array.from(table.querySelectorAll('th')).map(function(th) {
          return { text: th.textContent.trim(), width: th.offsetWidth };
        });

        // Test initial state
        var initialScrollLeft = wrapper ? wrapper.scrollLeft : null;
        var clientWidth = wrapper ? wrapper.clientWidth : null;
        var scrollWidth = wrapper ? wrapper.scrollWidth : null;

        // Scroll to end
        if (wrapper) wrapper.scrollLeft = 9999;
        var maxScrollLeft = wrapper ? wrapper.scrollLeft : null;

        return {
          windowWidth: winWidth,
          documentScrollWidth: docWidth,
          hasPageHorizontalOverflow: docWidth > winWidth,
          wrapperClientWidth: clientWidth,
          wrapperScrollWidth: scrollWidth,
          tableOffsetWidth: table ? table.offsetWidth : null,
          ribbonOffsetWidth: ribbon ? ribbon.offsetWidth : null,
          isScrollable: scrollWidth > clientWidth,
          initialScrollLeft: initialScrollLeft,
          maxScrollLeft: maxScrollLeft,
          columnHeaders: cols
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Table Test at 360px Results:');
  console.log(JSON.stringify(tableTest.result.value, null, 2));

  console.log('\n===================================================================');
  console.log('TEST 2: Header Navigation at 1024px across all main pages');
  console.log('===================================================================');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1024,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false
  });

  const pages = [
    'index.html',
    'home-2.html',
    'about.html',
    'services.html',
    'pricing.html',
    'blog.html',
    'contact.html',
    'blog-details.html'
  ];

  for (const pageName of pages) {
    await send('Page.navigate', { url: 'http://localhost:3000/' + pageName });
    await new Promise(r => setTimeout(r, 600));

    const navTest = await send('Runtime.evaluate', {
      expression: `
        (function() {
          var navContainer = document.querySelector('.nav-container');
          var logo = document.querySelector('.main-header .brand-logo');
          var navMenu = document.querySelector('.nav-menu');
          var headerActions = document.querySelector('.header-actions');
          var mobileToggle = document.querySelector('.mobile-toggle-btn');
          var callBtn = document.querySelector('#navCallBtn') || document.querySelector('#headerCallBtn') || document.querySelector('.btn-call-now');
          var themeBtn = document.querySelector('#themeToggleBtn');
          var rtlBtn = document.querySelector('#rtlToggleBtn');

          var callRect = callBtn ? callBtn.getBoundingClientRect() : null;
          var themeRect = themeBtn ? themeBtn.getBoundingClientRect() : null;
          var rtlRect = rtlBtn ? rtlBtn.getBoundingClientRect() : null;

          var links = Array.from(document.querySelectorAll('.nav-menu .nav-link')).map(function(a) {
            var r = a.getBoundingClientRect();
            return { text: a.textContent.trim(), top: Math.round(r.top), height: Math.round(r.height) };
          });

          var docWidth = document.documentElement.scrollWidth;
          var winWidth = window.innerWidth;

          return {
            page: '${pageName}',
            docWidth: docWidth,
            hasOverflow: docWidth > winWidth,
            navMenuHeight: navMenu ? navMenu.offsetHeight : null,
            navMenuDisplay: navMenu ? window.getComputedStyle(navMenu).display : null,
            mobileToggleDisplay: mobileToggle ? window.getComputedStyle(mobileToggle).display : null,
            itemTops: {
              firstLinkTop: links.length ? links[0].top : null,
              lastLinkTop: links.length ? links[links.length - 1].top : null,
              callBtnTop: callRect ? Math.round(callRect.top) : null,
              themeBtnTop: themeRect ? Math.round(themeRect.top) : null,
              rtlBtnTop: rtlRect ? Math.round(rtlRect.top) : null
            },
            buttonHeights: {
              callBtnHeight: callRect ? Math.round(callRect.height) : null,
              themeBtnHeight: themeRect ? Math.round(themeRect.height) : null,
              rtlBtnHeight: rtlRect ? Math.round(rtlRect.height) : null
            },
            ctaDetails: {
              text: callBtn ? callBtn.textContent.trim() : null,
              href: callBtn ? callBtn.getAttribute('href') : null,
              isCtaLast: callRect && rtlRect ? callRect.left > rtlRect.left : false
            },
            totalLinks: links.length
          };
        })()
      `,
      returnByValue: true
    });

    const res = navTest.result.value;
    const isSingleRow = res.navMenuHeight <= 45;
    const isAligned = res.itemTops.callBtnTop === res.itemTops.themeBtnTop && res.itemTops.themeBtnTop === res.itemTops.rtlBtnTop;
    const all38px = res.buttonHeights.callBtnHeight === 38 && res.buttonHeights.themeBtnHeight === 38 && res.buttonHeights.rtlBtnHeight === 38;

    console.log(`- ${pageName}: Single Row: ${isSingleRow} (h=${res.navMenuHeight}), Buttons Aligned: ${isAligned} (top=${res.itemTops.callBtnTop}), Height=38px: ${all38px}, CTA: "${res.ctaDetails.text}" -> ${res.ctaDetails.href} (isLast=${res.ctaDetails.isCtaLast}), No Overflow: ${!res.hasOverflow}`);
  }

  console.log('\n===================================================================');
  console.log('TEST 3: Responsiveness at multiple viewports on index.html');
  console.log('===================================================================');

  for (const w of [360, 480, 768, 992, 1024, 1200, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 768,
      deviceScaleFactor: 1,
      mobile: w < 768
    });
    await send('Page.navigate', { url: 'http://localhost:3000/index.html' });
    await new Promise(r => setTimeout(r, 500));

    const check = await send('Runtime.evaluate', {
      expression: `({
        width: window.innerWidth,
        docWidth: document.documentElement.scrollWidth,
        hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
        navDisplay: window.getComputedStyle(document.querySelector('.nav-menu')).display,
        mobileToggleDisplay: window.getComputedStyle(document.querySelector('.mobile-toggle-btn')).display
      })`,
      returnByValue: true
    });
    const c = check.result.value;
    console.log(`Viewport ${w}px: hasOverflow=${c.hasOverflow}, navDisplay=${c.navDisplay}, mobileToggleDisplay=${c.mobileToggleDisplay}`);
  }

  await send('Emulation.clearDeviceMetricsOverride');
  ws.close();
}

testFinal().catch(console.error);

const fs = require('fs');
const files = [
  'blog-details.html',
  'blog-details-expensive-keys.html',
  'blog-details-laser-cut.html',
  'blog-details-lockout-safety.html',
  'blog-details-mobile-van.html',
  'blog-details-transponder-theft.html'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('id="headerCallBtn"') && content.includes('<div class="header-actions">')) {
    const callBtnMatch = content.match(/<!-- Call Now Golden Button[^>]*-->\s*<a href="tel:\+18005555397" class="btn btn-call-now" id="headerCallBtn"[^>]*>[\s\S]*?<\/a>/i);
    if (callBtnMatch) {
      content = content.replace(callBtnMatch[0], '');
      const navCta = `        <a href="tel:+18005555397" class="btn btn-call-now nav-cta-btn" id="navCallBtn" title="Call Keyora 24/7 Dispatch">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
          <span>Call Now</span>
        </a>
      </nav>`;
      content = content.replace('      </nav>', navCta);
      fs.writeFileSync(f, content, 'utf8');
      console.log('Normalized header in ' + f);
    }
  }
});

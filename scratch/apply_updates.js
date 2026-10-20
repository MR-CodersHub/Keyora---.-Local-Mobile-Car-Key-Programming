const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Update all tel:8005555397 to tel:+18005555397
  content = content.replace(/href="tel:8005555397"/g, 'href="tel:+18005555397"');

  // 2. Wrap footer brand logo in an <a> tag pointing to index.html
  // Replace <div class="brand-logo" style="margin-bottom:16px;">\s*<img src="images/keyora-logo-white.svg"...></div>
  // or <div style="margin-bottom:16px;">\s*<img src="images/keyora-logo-white.svg"...></div>
  const footerIdx = content.indexOf('<footer');
  if (footerIdx !== -1) {
    const beforeFooter = content.substring(0, footerIdx);
    let footerContent = content.substring(footerIdx);

    // Replace footer logo wrapper
    footerContent = footerContent.replace(
      /<div(?:\s+class="brand-logo")?\s+style="margin-bottom:16px;">\s*<img\s+src="images\/keyora-logo-white\.svg"\s+alt="Keyora Mobile Auto Locksmith"\s+class="brand-logo-img"[^>]*?>\s*<\/div>/i,
      `<a href="index.html" class="brand-logo footer-brand-link" aria-label="Keyora Home" title="Keyora Mobile Auto Locksmith">\n            <img src="images/keyora-logo-white.svg" alt="Keyora Mobile Auto Locksmith" class="brand-logo-img" width="220" height="46">\n          </a>`
    );

    // Update hotline box if it's the simplified version
    footerContent = footerContent.replace(
      /<div class="footer-hotline-box">\s*<div style="font-size:0\.75rem; text-transform:uppercase; color:var\(--color-gold\); font-weight:700;">Emergency Hotline<\/div>\s*<a href="tel:\+18005555397"[^>]*?>\(800\) 555-5397<\/a>\s*<\/div>/i,
      `<div class="footer-hotline-box">\n            <div style="font-size:0.75rem; text-transform:uppercase; color:var(--color-gold); font-weight:700; letter-spacing:0.04em;">24/7 Emergency Dispatch</div>\n            <a href="tel:+18005555397" style="font-family:var(--font-heading); font-size:1.35rem; font-weight:900; color:#ffffff; display:inline-flex; align-items:center; gap:8px;">\n              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>\n              (800) 555-5397\n            </a>\n          </div>`
    );

    // Update bottom row links if they have '#'
    footerContent = footerContent.replace(
      /<a href="#">Privacy Policy<\/a>\s*<a href="#">Terms of Service<\/a>/g,
      '<a href="contact.html#privacy">Privacy Policy</a>\n          <a href="contact.html#terms">Terms of Service</a>'
    );

    content = beforeFooter + footerContent;
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`No changes needed for ${file}`);
  }
});

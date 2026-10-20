const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const telCount = (content.match(/tel:8005555397/g) || []).length;
  const telPlusCount = (content.match(/tel:\+18005555397/g) || []).length;
  const footerIdx = content.indexOf('<footer');
  let footerHasLink = false;
  if (footerIdx !== -1) {
    const footerContent = content.substring(footerIdx);
    footerHasLink = footerContent.includes('footer-brand-link') || /<a[^>]*?>\s*<img[^>]*?keyora-logo/i.test(footerContent);
  }
  console.log(`${f}: tel:8005555397=${telCount}, tel:+18005555397=${telPlusCount}, footerBrandHasLink=${footerHasLink}`);
});

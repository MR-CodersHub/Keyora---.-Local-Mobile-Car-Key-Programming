const fs = require('fs');
const path = require('path');

const targetFiles = [
  'home-2.html',
  'about.html',
  'services.html',
  'pricing.html',
  'blog.html',
  'contact.html',
  'blog-details.html',
  'blog-details-expensive-keys.html',
  'blog-details-laser-cut.html',
  'blog-details-lockout-safety.html',
  'blog-details-mobile-van.html',
  'blog-details-transponder-theft.html',
  '404.html'
];

const ctaHtml = `
        <!-- CTA Button in LAST Position -->
        <a href="contact.html" class="btn btn-call-now header-cta-btn" id="headerCtaBtn"
          title="Contact Keyora 24/7 Dispatch">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
          <span>Contact Us</span>
        </a>`;

for (const file of targetFiles) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // 1. Remove navCallBtn from nav-menu if present
  content = content.replace(/\s*<a href="tel:[^"]*" class="btn btn-call-now nav-cta-btn" id="navCallBtn"[\s\S]*?<\/a>\s*<\/nav>/, '\n      </nav>');

  // 2. Insert CTA button inside header-actions right before mobile-toggle-btn or mobileMenuToggle
  if (!content.includes('id="headerCtaBtn"')) {
    content = content.replace(/(\s*)(<button class="mobile-toggle-btn" id="mobileMenuToggle"|<button id="mobileMenuToggle" class="mobile-toggle-btn")/, `${ctaHtml}\n$1$2`);
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated ${file}`);
}

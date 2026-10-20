const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('class="btn') || line.includes('class="hero-actions') || line.includes('nav-cta-btn') || line.includes('btn-call-now')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});

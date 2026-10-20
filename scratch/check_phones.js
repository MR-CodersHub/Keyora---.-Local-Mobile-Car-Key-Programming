const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html') || f.endsWith('.js'));
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.match(/(?:\+?1[-. ]?)?\(?800\)?[-. ]?555[-. ]?(?:KEYS|\d{4})/gi) || [];
  const telMatches = content.match(/tel:[^"'>\s]+/gi) || [];
  if (matches.length || telMatches.length) {
    console.log(f + ':');
    console.log('  matches:', Array.from(new Set(matches)));
    console.log('  tels:', Array.from(new Set(telMatches)));
  }
});

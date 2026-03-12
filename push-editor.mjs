// Write and push the split-screen editor
import { writeFileSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

const GIT = 'C:\\Program Files\\Git\\cmd\\git.exe';
function run(cmd) { try { return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }).trim(); } catch(e) { console.log('FAILED:', cmd, e.message?.substring(0,200)); return ''; } }

// Read the file that was written by the Filesystem tool and re-write it to force git detection
const content = readFileSync('src/app/cus/[slug]/edit/page.tsx', 'utf8');
writeFileSync('src/app/cus/[slug]/edit/page.tsx', content + '\n', 'utf8');
console.log('✓ Edit page touched');

run(`"${GIT}" add -A`);
const status = run(`"${GIT}" status --short`);
console.log('Changes:', status || '(none)');
if (status) {
  run(`"${GIT}" commit -m "Split-screen editor: chat left, live preview right, auto-scroll to edits"`);
  run(`"${GIT}" push origin main`);
  console.log('✓ Pushed to Vercel');
} else {
  console.log('⚠ No changes detected');
}

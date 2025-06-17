import fs from 'fs';

const data = JSON.parse(fs.readFileSync('raw-metrics.json', 'utf-8'));

console.log('| File | CC Violations | Prop Violations | V‑If Violations |');
console.log('|------|---------------|-----------------|-----------------|');

data.forEach(({ file, violations }) => {
  const ccCount    = (violations.cyclomaticComplexity    || []).length;
  const propCount  = (violations.tooManyProps           || []).length;
  const vifCount   = (violations.bigVif                || []).length;
  console.log(`| ${file.split('/').pop()} | ${ccCount} | ${propCount} | ${vifCount} |`);
});

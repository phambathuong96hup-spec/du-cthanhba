// Script to remove duplicate ID blocks from index.html
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'public', 'webapp', 'quan-ly-cong-viec', 'index.html');
let lines = fs.readFileSync(file, 'utf8').split('\n');
const origCount = lines.length;

// Ranges to remove (1-indexed): 
// 176-187: inlineTaskFormWrap (dead code)
// 330-461: pills-input tab (duplicates task modal IDs)
// 465-500: old compliance form (duplicates compliance modal IDs)
const skipRanges = [[176, 187], [330, 461], [465, 500]];

const keep = lines.filter((_, i) => {
    const lineNum = i + 1;
    return !skipRanges.some(([s, e]) => lineNum >= s && lineNum <= e);
});

fs.writeFileSync(file, keep.join('\n'), 'utf8');
console.log(`Done. ${origCount} -> ${keep.length} lines (removed ${origCount - keep.length})`);

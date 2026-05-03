import fs from 'fs';

const path = 'E:\\APP\\khoa-dược---ttyt-khu-vực-thanh-ba\\src\\data\\articles\\hng-dn-qun-l-v-iu-tr-vim-gan-virus-c.md';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

function getTableMd(startPrefix, endPrefix, numCols) {
    let s = -1, e = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].replace(/\s/g, '').includes(startPrefix.replace(/\s/g, ''))) {
            s = i + 1;
        } else if (s !== -1 && i > s && lines[i].replace(/\s/g, '').includes(endPrefix.replace(/\s/g, ''))) {
            e = i;
            break;
        }
    }
    if (e === -1 && s !== -1) e = lines.length;
    if (s === -1) return null;

    let block = lines.slice(s, e).join('\n');
    let parts = block.split(/\n\t\n/);
    
    let betterCells = [];
    parts.forEach(p => {
        if (p.match(/\n\n+/)) {
            let sub = p.split(/\n\n+/);
            betterCells.push(sub[0].trim());
            betterCells.push(sub.slice(1).join(' ').trim());
        } else {
            betterCells.push(p.trim());
        }
    });

    betterCells = betterCells.map(c => c.replace(/\n\s*/g, ' '));

    let tableMd = [];
    if (betterCells.length >= numCols) {
        let headers = betterCells.slice(0, numCols);
        tableMd.push('| ' + headers.join(' | ') + ' |');
        tableMd.push('| ' + headers.map(() => '---').join(' | ') + ' |');
        
        for (let i = numCols; i < betterCells.length; i += numCols) {
            let row = betterCells.slice(i, i + numCols);
            while (row.length < numCols) row.push('');
            tableMd.push('| ' + row.join(' | ') + ' |');
        }
    }
    return { s, e, md: tableMd.join('\n') + '\n\n' };
}

let replacements = [];
replacements.push(getTableMd('Bảng 1:', 'Ghi chú:', 5));
replacements.push(getTableMd('Bảng 2:', 'Khuyến nghịvềđiềutrị', 5));
replacements.push(getTableMd('Bảng 3:', 'Bảng 4:', 4));
replacements.push(getTableMd('Bảng 4:', 'KhuyếncáođiềutrịHCVsaughéptạng', 5));
replacements.push(getTableMd('Bảng 5:', 'Dữ liệumớiủnghộ', 5));

// Apply replacements from bottom to top to avoid shifting line indices
replacements.sort((a, b) => b.s - a.s);

for (let r of replacements) {
    if (r) {
        lines.splice(r.s, r.e - r.s, r.md);
    }
}

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Fixed markdown file!');

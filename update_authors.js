import fs from 'fs';
import path from 'path';

const dir = 'E:\\APP\\khoa-dược---ttyt-khu-vực-thanh-ba\\src\\data\\articles';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

let changedCount = 0;

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    // First replace "Tổ Dược LLS"
    newContent = newContent.replace(/Tổ Dược LLS/g, 'Tổ Dược lâm sàng - DS Lê Thị Thanh Nhàn');
    
    // Then replace "Tổ Dược lâm sàng" if it doesn't already have the suffix
    newContent = newContent.replace(/Tổ Dược lâm sàng(?!\s*-\s*DS Lê Thị Thanh Nhàn)/g, 'Tổ Dược lâm sàng - DS Lê Thị Thanh Nhàn');

    // Also replace potential variations with different casing if they exist for author field
    // wait, what about "TỔ DƯỢC LÂM SÀNG"?
    newContent = newContent.replace(/TỔ DƯỢC LÂM SÀNG(?!\s*-\s*DS LÊ THỊ THANH NHÀN)/g, 'TỔ DƯỢC LÂM SÀNG - DS LÊ THỊ THANH NHÀN');

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        changedCount++;
    }
}

console.log(`Updated ${changedCount} files successfully.`);

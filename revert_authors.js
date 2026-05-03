import fs from 'fs';
import path from 'path';

const dir = 'E:\\APP\\khoa-dược---ttyt-khu-vực-thanh-ba\\src\\data\\articles';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

let changedCount = 0;

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    // Revert the wrong suffixes
    newContent = newContent.replace(/Tổ Dược lâm sàng - DS Lê Thị Thanh Nhàn/g, 'Tổ Dược lâm sàng');
    newContent = newContent.replace(/TỔ DƯỢC LÂM SÀNG - DS LÊ THỊ THANH NHÀN/g, 'TỔ DƯỢC LÂM SÀNG');
    
    // Ensure that it's nicely named as Tổ Dược lâm sàng instead of Tổ Dược LLS 
    newContent = newContent.replace(/Tổ Dược LLS/g, 'Tổ Dược lâm sàng');

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        changedCount++;
    }
}

console.log(`Reverted and normalized ${changedCount} files successfully.`);

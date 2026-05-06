const { execSync } = require('child_process');
const fs = require('fs');
try {
    const out = execSync('git log -p -n 10 js/tasks.js').toString();
    fs.writeFileSync('git_log_tasks.txt', out);
    console.log("Success");
} catch(e) {
    console.error(e.message);
}

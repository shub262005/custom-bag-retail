const fs = require('fs');
const p = 'frontend/src/features/sales/SaleFormPage.tsx';
let content = fs.readFileSync(p, 'utf8');
content = content.split('Â·').join('•');
content = content.split('â€”').join('—');
content = content.split('â€¦').join('...');
fs.writeFileSync(p, content, 'utf8');
console.log('Cleaned successfully');


const fs = require('fs');

const file = 'forge/accra_food_festival_post.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// fix mismatch
data.metadata.seoMetadata.title = "Vibrant Food Festival Instagram Post Promotion — Free Instagram post Template";

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log('Fixed accra food festival title');

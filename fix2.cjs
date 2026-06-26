const fs = require('fs');

const file2 = 'forge/naija_tech_startup_pitch.json';
const data2 = JSON.parse(fs.readFileSync(file2, 'utf8'));

// shorten to under 80 chars
data2.metadata.shortDescription = "Command attention with this trust-signalling pitch deck cover.";
fs.writeFileSync(file2, JSON.stringify(data2, null, 2) + '\n');
console.log('Fixed naija tech short desc');

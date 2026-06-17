import fs from 'node:fs';
const files = ['wp-posts.ndjson', 'wp-resources.ndjson'];
const output = 'wp-all.ndjson';
const seen = new Set();
const lines = [];
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const doc = JSON.parse(line);
    if (!doc._id || seen.has(doc._id)) continue;
    seen.add(doc._id);
    lines.push(JSON.stringify(doc));
  }
}
fs.writeFileSync(output, lines.join('\n') + '\n', 'utf8');
console.log(`Merged ${lines.length} documents into ${output}`);

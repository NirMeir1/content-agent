import fs from 'node:fs';
const filename = process.argv[2];
const b = fs.readFileSync(filename);
const pe = b.readUInt32LE(0x3c), optional = pe + 24;
const magic = b.readUInt16LE(optional);
const directory = optional + (magic === 0x20b ? 112 : 96);
const sections = pe + 24 + b.readUInt16LE(pe + 20);
function offset(rva) {
  for (let i = 0; i < b.readUInt16LE(pe + 6); i++) {
    const s = sections + i * 40, va = b.readUInt32LE(s + 12);
    if (rva >= va && rva < va + Math.max(b.readUInt32LE(s + 8), b.readUInt32LE(s + 16))) return b.readUInt32LE(s + 20) + rva - va;
  }
  throw new Error('Invalid RVA');
}
const imports = [];
let entry = offset(b.readUInt32LE(directory + 8));
while (b.readUInt32LE(entry + 12)) {
  const name = offset(b.readUInt32LE(entry + 12)); imports.push(b.subarray(name, b.indexOf(0, name)).toString()); entry += 20;
}
console.log(JSON.stringify({ filename, imports }, null, 2));

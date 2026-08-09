const fs = require('fs');
const glob = require('glob');

const paths = [
  'c:/Users/micha/OneDrive/Dokumenty/Coding/mathify/src/app/api/teacher/materials/[materialId]/route.ts',
  'c:/Users/micha/OneDrive/Dokumenty/Coding/mathify/src/app/api/teacher/materials/bulk-delete/route.ts',
  'c:/Users/micha/OneDrive/Dokumenty/Coding/mathify/src/app/api/teacher/subchapters/[subchapterId]/materials/link/route.ts'
];

for (const p of paths) {
  let content = fs.readFileSync(p, 'utf8');
  content = content.replace(/material\.materialSubchapters/g, 'material.subchapters');
  content = content.replace(/materialSubchapters: {/g, 'subchapters: {');
  content = content.replace(/materialWithSubchapters\.materialSubchapters/g, 'materialWithSubchapters.subchapters');
  fs.writeFileSync(p, content);
  console.log('Fixed ' + p);
}

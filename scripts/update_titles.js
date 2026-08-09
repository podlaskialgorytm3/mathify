const fs = require('fs');

const updates = [
  { path: 'src/app/dashboard/teacher/submissions/layout.tsx', old: 'Wszystkie Prace Domowe', new: 'Odpowiedzi' },
  { path: 'src/app/dashboard/teacher/students/[studentId]/layout.tsx', old: 'Profil Ucznia', new: 'Profil ucznia' },
  { path: 'src/app/dashboard/teacher/students/[studentId]/courses/[courseId]/layout.tsx', old: 'Postęp Ucznia', new: 'Kurs ucznia' },
  { path: 'src/app/dashboard/teacher/students/layout.tsx', old: 'Uczniowie', new: 'Uczniowie' },
  { path: 'src/app/dashboard/teacher/created-students/layout.tsx', old: 'Wygenerowane Konta', new: 'Utworzone Konta' },
  { path: 'src/app/dashboard/teacher/create-student/layout.tsx', old: 'Tworzenie Kont', new: 'Tworzenie Kont' },
  { path: 'src/app/dashboard/teacher/courses/[id]/submissions/layout.tsx', old: 'Prace domowe kursu', new: 'Odpowiedzi' },
  { path: 'src/app/dashboard/teacher/courses/[id]/layout.tsx', old: 'Szczegóły Kursu', new: 'Szczegóły kursu' },
  { path: 'src/app/dashboard/teacher/courses/layout.tsx', old: 'Kursy', new: 'Moje kursy' },
  { path: 'src/app/dashboard/teacher/ai-prompts/layout.tsx', old: 'Prompty AI', new: 'Szablony AI' },
];

for (const u of updates) {
  if (fs.existsSync(u.path)) {
    let content = fs.readFileSync(u.path, 'utf8');
    content = content.replace(new RegExp(`title: "${u.old}( - Mathify)?"`), `title: "${u.new} - Mathify"`);
    fs.writeFileSync(u.path, content);
    console.log(`Updated ${u.path}`);
  } else {
    console.log(`Not found: ${u.path}`);
  }
}

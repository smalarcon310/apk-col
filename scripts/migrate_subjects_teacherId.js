/*
Migration script: migrate_subjects_teacherId.js

Usage:
  1) Place a Firebase service account JSON file at the project root named `serviceAccountKey.json`, OR set env var SERVICE_ACCOUNT_PATH to the path.
  2) From project root run: `node ./scripts/migrate_subjects_teacherId.js`

What it does:
 - Reads all teachers and subjects from Firestore using firebase-admin
 - For each subject that has `teacher` (name) but no `teacherId`, tries to resolve the teacher by full name and sets `teacherId` on the subject document.
 - For each teacher that has `subjects` as an array of names, attempts to resolve those names to subject IDs when a unique match exists and updates the teacher document to store subject IDs instead of names.

Notes:
 - This script requires admin privileges. Do NOT commit your service account key to source control.
 - The script will log what it changes and skip ambiguous mappings.
*/

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH || path.join(process.cwd(), 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('Service account file not found:', serviceAccountPath);
  console.error('Set SERVICE_ACCOUNT_PATH or place serviceAccountKey.json in the project root.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});

const db = admin.firestore();

async function run() {
  console.log('Starting migration: attach teacherId to subjects and convert teacher.subjects to subject IDs');

  const teachersSnap = await db.collection('teachers').get();
  const subjectsSnap = await db.collection('subjects').get();

  const teachers = [];
  teachersSnap.forEach((d) => teachers.push({ id: d.id, ...d.data() }));

  const subjects = [];
  subjectsSnap.forEach((d) => subjects.push({ id: d.id, ...d.data() }));

  const teacherByName = {};
  teachers.forEach((t) => {
    const full = `${t.firstName} ${t.lastName}`.trim();
    teacherByName[full] = teacherByName[full] || [];
    teacherByName[full].push(t.id);
  });

  // 1) Update subjects: set teacherId when missing and teacher name matches uniquely
  let updatedSubjects = 0;
  for (const subj of subjects) {
    if (!subj.teacherId && subj.teacher) {
      const full = subj.teacher.trim();
      const matches = teacherByName[full] || [];
      if (matches.length === 1) {
        const tid = matches[0];
        await db.collection('subjects').doc(subj.id).update({ teacherId: tid });
        updatedSubjects++;
        console.log(`Updated subject ${subj.name} (${subj.id}) -> teacherId ${tid}`);
      } else if (matches.length > 1) {
        console.warn(`Ambiguous teacher name for subject ${subj.name} (${subj.id}): found multiple teachers for '${full}', skipping`);
      } else {
        console.warn(`No teacher found for subject ${subj.name} (${subj.id}) with name '${full}'`);
      }
    }
  }

  // refresh subjects list after potential updates
  const subjectsSnap2 = await db.collection('subjects').get();
  const subjectsRefreshed = [];
  subjectsSnap2.forEach((d) => subjectsRefreshed.push({ id: d.id, ...d.data() }));

  // helper: find subjects by name
  const subjectsByName = {};
  subjectsRefreshed.forEach((s) => {
    subjectsByName[s.name] = subjectsByName[s.name] || [];
    subjectsByName[s.name].push(s);
  });

  // 2) Update teachers: convert subjects names -> subject IDs when unambiguous
  let updatedTeachers = 0;
  for (const t of teachers) {
    const subs = t.subjects || [];
    if (!Array.isArray(subs) || subs.length === 0) continue;

    // if already seems to be IDs (matching some subject ids), skip
    const looksLikeIds = subs.every((x) => subjectsRefreshed.find((s) => s.id === x));
    if (looksLikeIds) continue;

    const converted = [];
    for (const nameOrId of subs) {
      // if it's already an id -> push
      const existing = subjectsRefreshed.find((s) => s.id === nameOrId);
      if (existing) {
        converted.push(existing.id);
        continue;
      }

      const byName = subjectsByName[nameOrId] || [];
      if (byName.length === 1) {
        converted.push(byName[0].id);
      } else if (byName.length > 1) {
        // try to prefer subject that links to this teacher by teacherId or teacher name
        const linked = byName.filter((s) => (s.teacherId && s.teacherId === t.id) || (s.teacher && `${t.firstName} ${t.lastName}` === s.teacher));
        if (linked.length === 1) converted.push(linked[0].id);
        else {
          console.warn(`Ambiguous subject name '${nameOrId}' for teacher ${t.id}, skipping conversion for this entry.`);
          converted.push(nameOrId); // keep original to avoid data loss
        }
      } else {
        console.warn(`No subject found with name '${nameOrId}' for teacher ${t.id}, leaving original.`);
        converted.push(nameOrId);
      }
    }

    // if conversion changed the array (and at least one resolved to an id), update
    const changed = JSON.stringify(converted) !== JSON.stringify(subs);
    if (changed) {
      await db.collection('teachers').doc(t.id).update({ subjects: converted });
      updatedTeachers++;
      console.log(`Updated teacher ${t.id} subjects -> [${converted.join(', ')}]`);
    }
  }

  console.log('Migration finished. Subjects updated:', updatedSubjects, 'Teachers updated:', updatedTeachers);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

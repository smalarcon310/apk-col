/*
  Migration script to convert legacy `stage1..stage4` fields into a single `progress` field
  and remove the stage fields from each document in the `avances` collection.

  Usage:
    1. Install dependencies: npm install firebase-admin
    2. Set environment variable: GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccountKey.json
    3. Run: node scripts/migrate_avances_to_progress.js

  Warning: This script updates documents in Firestore. Run on a copy or with a backup first.
*/

const admin = require('firebase-admin');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Please set GOOGLE_APPLICATION_CREDENTIALS pointing to a service account JSON.');
  process.exit(1);
}

admin.initializeApp();
const db = admin.firestore();

async function migrate() {
  const col = db.collection('avances');
  const snapshot = await col.get();
  console.log(`Found ${snapshot.size} avance documents.`);

  let updated = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();

    // If progress already exists and no legacy stages, skip
    const hasStages = data.stage1 !== undefined || data.stage2 !== undefined || data.stage3 !== undefined || data.stage4 !== undefined;
    if (!hasStages) continue;

    const stages = [Number(data.stage1 || 0), Number(data.stage2 || 0), Number(data.stage3 || 0), Number(data.stage4 || 0)];
    const sum = stages.reduce((a, b) => a + b, 0);
    const avg = Math.round((sum / stages.length) * 100) / 100;

    const toUpdate = {
      progress: avg,
      average: avg,
    };

    // remove legacy fields
    toUpdate.stage1 = admin.firestore.FieldValue.delete();
    toUpdate.stage2 = admin.firestore.FieldValue.delete();
    toUpdate.stage3 = admin.firestore.FieldValue.delete();
    toUpdate.stage4 = admin.firestore.FieldValue.delete();

    await doc.ref.update(toUpdate);
    updated += 1;
    if (updated % 100 === 0) console.log(`Updated ${updated} documents...`);
  }

  console.log(`Migration completed. Updated ${updated} documents.`);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../firebase-key.json');
admin.initializeApp({ credential: admin.credential.cert(require(serviceAccountPath)) });
const db = admin.firestore();

async function find(email) {
  console.log('Buscando email:', email);
  const results = {};

  try {
    const rSnap = await db.collection('rectors').where('email', '==', email).get();
    results.rectors = rSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { results.rectors = { error: e.message }; }

  try {
    const sSnap = await db.collection('students').where('email', '==', email).get();
    results.students = sSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { results.students = { error: e.message }; }

  try {
    const tSnap = await db.collection('teachers').where('email', '==', email).get();
    results.teachers = tSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { results.teachers = { error: e.message }; }

  console.log(JSON.stringify(results, null, 2));
  try { await admin.app().delete(); } catch (e) {}
}

const email = process.argv[2] || 'sergioalarcon310@gmail.com';
find(email).catch(err => { console.error(err); admin.app().delete(); });

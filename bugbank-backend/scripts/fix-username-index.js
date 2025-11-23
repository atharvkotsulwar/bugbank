// scripts/fix-username-index.js
require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/test';
  console.log('[fix-username-index] connecting:', uri);

  await mongoose.connect(uri, { autoIndex: false });
  const coll = mongoose.connection.db.collection('users');

  const idx = await coll.indexes();
  const usernameIdx = idx.filter(i => i.key && i.key.username === 1);

  if (usernameIdx.length) {
    for (const i of usernameIdx) {
      console.log('[fix-username-index] dropping', i.name);
      try {
        await coll.dropIndex(i.name);
      } catch (e) {
        console.warn('[fix-username-index] drop failed:', e.message);
      }
    }
  } else {
    console.log('[fix-username-index] no username index found to drop');
  }

  // Recreate partial unique index (optional—skip if you don't want usernames)
  console.log('[fix-username-index] creating partial unique index on username');
  try {
    await coll.createIndex(
      { username: 1 },
      { unique: true, partialFilterExpression: { username: { $type: 'string' } } }
    );
  } catch (e) {
    console.warn('[fix-username-index] createIndex warning:', e.message);
  }

  const after = await coll.indexes();
  console.log('[fix-username-index] indexes now:', after.map(i => i.name));
  await mongoose.disconnect();
  console.log('[fix-username-index] done');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

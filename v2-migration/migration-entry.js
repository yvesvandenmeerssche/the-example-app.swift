const runMigration = require('contentful-migration/built/bin/cli').runMigration;
const options = {
    filePath: './lessons-to-rich-text2.js',
    spaceId: 'oqj4q68x2iv3',
    accessToken: 'be3bd9a3f8425855f8beaf79b4388fc1627c248e81e43583dc1086e28b2e36e7'
  };
  runMigration(options)
    .then(() => console.log('Migration Done!'))
    .catch((e) => console.error);
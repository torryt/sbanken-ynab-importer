const importer = require('./service/ynabimporter');

async function main() {
  try {
    const result = await importer.importRecentSbankenTransactions();
    console.log(result);
  } catch (e) {
    console.error(e);
  }
}

main()
  .then(() => console.log('Complete!'));

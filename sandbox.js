const importer = require('./service/ynabimporter');

importer.importRecentSbankenTransactions()
  .then((x) => {
    console.log(x);
  })
  .catch((err) => {
    console.error(err);
  });

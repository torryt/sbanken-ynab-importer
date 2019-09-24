const ynabApi = require('./service/ynabapi');
const { ynab: { budgetId } } = require('./user.config');

const transactions = [{}];

ynabApi.importTransactions(budgetId, transactions)
  .then((x) => {
    console.log(x);
  })
  .catch((err) => {
    console.error(err);
  });

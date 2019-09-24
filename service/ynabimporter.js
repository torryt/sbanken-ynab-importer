const { parseISO, format, compareAsc } = require('date-fns');
const keyBy = require('lodash.keyby');

const sbankenApi = require('./sbankenapi');
const ynabApi = require('./ynabapi');

const { accounts, ynab } = require('../user.config');

function formatDate(isoDate) {
  const date = parseISO(isoDate);
  return format(date, 'yyyy-MM-dd');
}

function cleanTransactionText(text) {
  const payDateRegex = / Betalt: [0-9]+\.[0-9]+\.[0-9]+/;
  const datePrefixRegex = /^[0-9][0-9]\.[0-9][0-9] /;
  return text
    .replace('Til: ', '')
    .replace('Fra: ', '')
    .replace(payDateRegex, '')
    .replace(datePrefixRegex, '')
    .replace(/\s\s+/g, ' ');
}

function amountToMilliunits(amount) {
  return Math.floor(amount * 1000);
}

function makeImportId(amount, date, postfix) {
  const importId = `API:${amount}:${date}:${postfix}`;
  return importId;
}
exports.makeImportId = makeImportId;

function mapToYnabImportFormat(transaction, ynabAccountId) {
  const payee = transaction.cardDetails && transaction.cardDetails.merchantName;
  const amount = amountToMilliunits(transaction.amount);
  const date = formatDate(transaction.accountingDate);

  return {
    account_id: ynabAccountId,
    date,
    amount,
    memo: transaction.transactionType,
    payee_name: payee || cleanTransactionText(transaction.text),
    cleared: 'cleared',
    approved: false,
    import_id: makeImportId(amount, date, 0),
  };
}
exports.mapToYnabImportFormat = mapToYnabImportFormat;

function deduplicateImportIds(transactions) {
  const newTransactions = transactions.reduce((acc, curr) => {
    const dict = keyBy(acc, 'import_id');

    let iterator = 0;

    let hasDuplicate = true;
    while (hasDuplicate) {
      iterator += 1;
      const key = makeImportId(curr.amount, curr.date, iterator);
      if (dict[key] === undefined) {
        hasDuplicate = false;
      }
    }
    const importId = makeImportId(curr.amount, curr.date, iterator);
    const transaction = ({
      ...curr,
      import_id: importId,
    });
    acc.push(transaction);
    return acc;
  }, []);
  return newTransactions;
}
exports.deduplicateImportIds = deduplicateImportIds;


exports.importRecentSbankenTransactions = async () => {
  const response = await sbankenApi.getAccessToken();

  const accountPromises = accounts.map(async (account) => {
    const transactionsResponse = await sbankenApi.getAccountTransactions(
      response.access_token,
      account.sbankenId,
    );
    const ynabData = transactionsResponse.items
      .filter((x) => !x.isReservation)
      .map((transaction) => mapToYnabImportFormat(transaction, account.ynabId));

    return deduplicateImportIds(ynabData);
  });

  const allResults = await Promise.all(accountPromises);

  const flattenedTransactions = allResults
    .reduce((acc, curr) => acc.concat(curr), [])
    .sort((a, b) => compareAsc(parseISO(a.date), parseISO(b.date)));

  const updateResponse = await ynabApi.importTransactions(ynab.budgetId, flattenedTransactions);

  return {
    updatedItems: updateResponse.transaction_ids.length,
    ...updateResponse,
  };
  // return {
  //   availableItems: flattenedTransactions.length,
  //   items: flattenedTransactions,
  // };
};

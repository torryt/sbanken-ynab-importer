/* eslint-disable no-param-reassign */
const { parseISO, format, compareAsc } = require('date-fns');
const keyBy = require('lodash.keyby');
const uuid = require('uuid/v4');

const sbankenApi = require('./sbankenapi');
const ynabApi = require('./ynabapi');

const config = require('../user.config');

const userAccounts = config.accounts;
const { ynab } = config;

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
  const importId = makeImportId(amount, date, 0);
  return {
    account_id: ynabAccountId,
    date,
    amount,
    memo: transaction.transactionType,
    payee_name: payee || cleanTransactionText(transaction.text),
    cleared: 'cleared',
    approved: false,
    import_id: importId,
    key: uuid(),
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

function isTransfer(transaction) {
  return transaction.payee_name === 'Overføring mellom egne kontoer'
    || (transaction.memo === 'Overføring' && transaction.payee_name === 'NETTBANK');
}

let cachedAccounts = null;
function getMatchPayeeId(matches) {
  if (matches.length === 0) {
    return [null];
  }

  const match = matches[0];

  const accounts = cachedAccounts.filter((x) => x.id === match.account_id);

  if (accounts.length == null) {
    return [null];
  }

  return [match, accounts[0].transfer_payee_id];
}

function matchInternalTransfers(transactions) {
  // eslint-disable-next-line no-unused-vars
  const withoutIncomingTransfers = transactions.filter((x) => !(isTransfer(x) && x.amount > 0));

  const withMappedTransfers = withoutIncomingTransfers.map((transaction) => {
    if (!isTransfer(transaction)) {
      return transaction;
    }
    const matches = transactions
      .filter((x) => x.amount === -transaction.amount
      && x.date === transaction.date
      && isTransfer(x));

    const [match, payeeId] = getMatchPayeeId(matches);
    if (match) {
      // eslint-disable-next-line camelcase
      const { payee_name, ...newTransaction } = transaction;
      return { ...newTransaction, payee_id: payeeId };
    }
    return transaction;
  });
  return withMappedTransfers;

  // const matched = transactions.map((transaction) => {
  //   if (!isTransfer(transaction)) {
  //     return { ...transaction };
  //   }

  //   const matches = transfers
  //     .filter((x) => x.amount === -transaction.amount && x.date === transaction.date);
  //   if (matches.length === 0) {
  //     return { ...transaction };
  //   }
  //   const accountMatchName = userAccounts.filter((x) => x.ynabId === matches[0].account_id)[0].ynabName;

  //   const newPayeeName = `Transfer ${transaction.amount < 0 ? 'to' : 'from'}: ${accountMatchName}`;

  //   return { ...transaction, payee_name: newPayeeName };
  // });
  // return matched;
}


exports.importRecentSbankenTransactions = async () => {
  const response = await sbankenApi.getAccessToken();
  cachedAccounts = await ynabApi.listAccounts(ynab.budgetId);

  const accountPromises = userAccounts.map(async (account) => {
    const transactionsResponse = await sbankenApi.getAccountTransactions(
      response.access_token,
      account.sbankenId,
    );
    const ynabData = transactionsResponse.items
      .filter((x) => !x.isReservation)
      .map((transaction) => mapToYnabImportFormat(transaction, account.ynabId));

    const deduplicated = deduplicateImportIds(ynabData);
    return deduplicated;
  });

  const allResults = await Promise.all(accountPromises);

  const flattenedTransactions = allResults
    .reduce((acc, curr) => acc.concat(curr), [])
    .sort((a, b) => compareAsc(parseISO(a.date), parseISO(b.date)));

  const withMatchedTransfers = matchInternalTransfers(flattenedTransactions);

  const updateResponse = await ynabApi.importTransactions(ynab.budgetId, withMatchedTransfers);

  return {
    updatedItems: updateResponse.transaction_ids.length,
    ...updateResponse,
  };
};

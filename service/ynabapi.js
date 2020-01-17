const axios = require('axios');
const { token } = require('../user.config').ynab;

const baseUrl = 'https://api.youneedabudget.com/v1';


const options = {
  headers: { Authorization: `Bearer ${token}` },
};

exports.importTransactions = async (budgetId, transactions) => {
  console.log(`Importing ${transactions.length} transactions to YNAB`);
  try {
    const response = await axios.post(`${baseUrl}/budgets/${budgetId}/transactions`,
      {
        transactions,
      }, options);
    return response.data.data;
  } catch (err) {
    throw Error(`Import of transactions failed with error: \n${err}`);
  }
};

exports.listBudgets = async () => {
  const response = await axios.get(`${baseUrl}/budgets`, options);
  return response.data.data.budgets;
};

exports.getBudget = async (budgetId) => {
  const response = await axios.get(`${baseUrl}/budgets/${budgetId}`, options);
  return response.data.data.budget;
};

exports.listAccounts = async (budgetId) => {
  const response = await axios.get(`${baseUrl}/budgets/${budgetId}/accounts`, options);
  return response.data.data.accounts;
};

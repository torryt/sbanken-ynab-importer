module.exports = {
  sbanken: {
    userid: 'XXXXXXXXXXX', // Norwegian 'Personnummer'
    clientid: '', // Sbanken API ClientId
    secret: '', // Sbanken API client secret
  },
  ynab: {
    token: '', // YNAB access token,
    budgetId: 'default', // Leave as DEFAULT or specify id
  },
  accounts: [
    {
      ynabId: '',
      sbankenId: '',
    },
  ],
};

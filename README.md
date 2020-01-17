# About
Sbanken YNAB Importer is a tool for automatic imports of transactions from Sbanken to YNAB. You can run it however you'd like. I myself prefer to run it as an AWS Lambda function through the serverless framework about every 10 minutes. Therefore, I've included an optional `serverless.yml` that you can use.

## Features
- 🤓 Smart diffing of transactions so no transactions are imported twice across runs
- 💳 Support for credit/debit card blocks(reservations). Optional feature.
- 🔥 Support for account transfers between Sbanken accounts

## Get started
1. Make a copy of `example.config.js` => `user.config.js`.
2. Get your Sbanken and YNAB credentials and fill in `user.config.js`
  - https://sbanken.no/bruke/utviklerportalen/
  - https://api.youneedabudget.com/
3. Start up the helper web app to get your account information with `npm install && npm run start`
4. Go to https://localhost:3001/api/budgets, pick out the YNAB accounts you'll want to use and fill in the account section of `user.config.js`
5. Match the YNAB accounts with Sbanken accounts by going to https://localhost:3001/api/accounts
6. Run `node sandbox.js` to test it out locally!
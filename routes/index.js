const express = require('express');

const router = express.Router();

const service = require('../service/sbankenapi');
const ynabService = require('../service/ynabapi');
const ynabImporter = require('../service/ynabimporter');

router.get('/api/data', (req, res) => {
  service.getAccessToken().then(
    (data) => service.listAccounts(data.access_token).then((accountsData) => {
      const requests = [];
      accountsData.items.forEach((account) => {
        const promise = service.getAccountTransactions(data.access_token, account.accountId);
        requests.push(promise);
      });

      const result = accountsData;
      return Promise.all(requests).then((responses) => {
        responses.forEach((val, index) => {
          result.items[index].transactions = val.items;
        });
        return res.json(accountsData);
      });
    }),
    () => {
      res.json({ error: 'Something went wrong' });
    },
  );
});

router.get('/api/importdata', async (req, res, next) => {
  try {
    const response = await ynabImporter.importRecentSbankenTransactions();
    res.json(response);
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get('/api/budgets', (req, res) => {
  ynabService.listBudgets().then((data) => res.json(data)).catch((err) => { console.error(err); });
});

router.get('/api/budgets/:id', (req, res) => {
  ynabService.getBudget(req.params.id)
    .then((data) => res.json(data))
    .catch((err) => { console.error(err); });
});

router.get('/api/accounts', (req, res) => {
  service.getAccessToken().then(
    (data) => {
      service.listAccounts(data.access_token).then(
        (accountDetails) => {
          res.json(accountDetails);
        },
        () => {
          res.json({});
        },
      );
    },
    () => {
      res.json({});
    },
  );
});

router.get('/api/accounts/:id', (req, res) => {
  service.getAccessToken().then(
    (data) => {
      service.getAccount(req.params.id, data.access_token).then(
        (accountDetails) => {
          res.json(accountDetails);
        },
        () => {
          res.json({});
        },
      );
    },
    () => {
      res.json({});
    },
  );
});

router.get('/api/transactions/:accountId', (req, res) => {
  const { startDate, endDate } = req.query;
  service.getAccessToken().then(
    (data) => {
      service.getAccountTransactions(
        data.access_token,
        req.params.accountId,
        startDate,
        endDate,
      ).then(
        (transactions) => {
          res.json(transactions);
        },
      );
    },
  ).catch((err) => console.warn(err));
});

module.exports = router;

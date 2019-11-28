const request = require('superagent');
const btoa = require('btoa');
const dateFns = require('date-fns');
const addDays = require('date-fns/fp/addDays');
const config = require('../user.config').sbanken;

const { clientid, secret, userid } = config;

const { format } = dateFns;
const bankApiUrl = 'https://api.sbanken.no/exec.bank';

exports.getAccessToken = () => {
  const identityServerUrl = 'https://auth.sbanken.no/identityserver/connect/token'; // access token endpoint

  const basicAuth = btoa(
    `${encodeURIComponent(clientid)}:${encodeURIComponent(secret)}`,
  ); // create basicAuth header value according to Oauth 2.0 standard

  const promise = new Promise((resolve, reject) => {
    request
      .post(identityServerUrl)
      .send('grant_type=client_credentials')
      .set('Authorization', `Basic ${basicAuth}`)
      .set('Accept', 'application/json')
      .set('customerId', userid)
      .end((err, res) => {
        if (err || !res.ok) {
          console.error(err);
          reject(err);
        } else {
          resolve(res.body);
        }
      });
  });

  return promise;
};

exports.listAccounts = (accessToken) => {
  const accountServiceUrl = `${bankApiUrl}/api/v1/accounts`;

  const promise = new Promise((resolve, reject) => {
    request
      .get(accountServiceUrl)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Accept', 'application/json')
      .set('customerId', userid)
      .end((err, res) => {
        if (err || !res.ok) {
          console.error(err);
          reject();
        } else {
          resolve(res.body);
        }
      });
  });

  return promise;
};

exports.getAccount = (accountId, accessToken) => {
  const accountServiceUrl = `${bankApiUrl}/api/v1/accounts/${accountId}`;

  const promise = new Promise((resolve, reject) => {
    request
      .get(accountServiceUrl)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Accept', 'application/json')
      .set('customerId', userid)
      .end((err, res) => {
        if (err || !res.ok) {
          console.error(err);
          reject();
        } else {
          resolve(res.body);
        }
      });
  });

  return promise;
};

exports.getAccountTransactions = (accessToken, accountId, startDate, endDate) => {
  const requestUrl = `${bankApiUrl}/api/v1/transactions/${accountId}`;

  const startDateReq = startDate || format(addDays(-7)(new Date()), 'yyyy-MM-dd');

  const endDateReq = endDate || format(new Date(), 'yyyy-MM-dd');

  const promise = new Promise((resolve, reject) => {
    request
      .get(requestUrl)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Accept', 'application/json')
      .set('customerId', userid)
      .query({ length: 1000 })
      .query({ startDate: startDateReq })
      .query({ endDate: endDateReq })
      .end((err, res) => {
        if (err || !res.ok) {
          console.log(err);
          reject();
        } else {
          resolve(res.body);
        }
      });
  });

  return promise;
};

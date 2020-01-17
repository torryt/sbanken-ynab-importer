const importer = require('./service/ynabimporter');
// const sbankenApi = require('./service/sbankenapi');

async function main() {
  // const accessToken = (await sbankenApi.getAccessToken()).access_token;
  // const result = await sbankenApi.listAccounts(accessToken);

  // const hello = result;
  // console.log(hello);
  try {
    const result = await importer.importRecentSbankenTransactions();
    console.log(result);
  } catch (e) {
    console.error(e);
  }
}

main()
  .then(() => console.log('Complete!'));

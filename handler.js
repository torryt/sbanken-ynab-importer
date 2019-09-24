const importer = require('./service/ynabimporter');

module.exports.importTransactions = async (event) => {
  let response = null;
  try {
    response = await importer.importRecentSbankenTransactions();
  } catch (err) {
    return ({
      statusCode: 500,
      body: JSON.stringify({
        message: `Something went wrong.\n${err}`,
      }),
    });
  }

  return ({
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Imported transactions successfully',
        input: event,
        result: response,
      },
      null,
      2,
    ),
  });
};

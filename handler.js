const importer = require('./service/ynabimporter');

module.exports.importTransactions = async (event) => {
  let response = null;
  try {
    response = await importer.importRecentSbankenTransactions();
    console.log(`Import successful!🤖🎉\n\n Result: \n${response}`);
  } catch (err) {
    console.error(err);
    return ({
      statusCode: 500,
      body: JSON.stringify({
        message: err,
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

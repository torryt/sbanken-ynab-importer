const { deduplicateImportIds } = require('./ynabimporter');

test('increments duplicate import ids', () => {
  const data = [
    {
      amount: 10000,
      date: '2019-09-01',
      import_id: 'API:10000:2019-09-01:0',
    },
    {
      amount: 10000,
      date: '2019-09-01',
      import_id: 'API:10000:2019-09-01:0',
    },
    {
      amount: 10001,
      date: '2019-09-01',
      import_id: 'API:10001:2019-09-01:0',
    },
  ];

  const result = deduplicateImportIds(data);

  expect(result[0].import_id).toBe('API:10000:2019-09-01:1');
  expect(result[1].import_id).toBe('API:10000:2019-09-01:2');
  expect(result[2].import_id).toBe('API:10001:2019-09-01:1');
});

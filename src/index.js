const fetch = require('node-fetch');
const { DateTime } = require('luxon');
const ics = require('ics');

const url = 'https://naestved.renoweb.dk/Legacy/JService.asmx/GetCalender_mitAffald';
const headers = {
  accept: 'application/json, text/javascript, */*; q=0.01',
  'accept-language': 'en-US,en;q=0.9,da;q=0.8',
  'cache-control': 'no-cache',
  'content-type': 'application/json; charset=UTF-8',
  pragma: 'no-cache',
};

const getDatesFor = async (materialId) => {
  const res = await fetch(url, {
    headers,
    body: JSON.stringify({ materialid: materialId }),
    method: 'POST',
  });
  const { list } = JSON.parse((await res.json()).d);
  return list.map((i) => {
    const dateString = i.match(/\d{2}-\d{2}-\d{4}$/)[0];
    return DateTime.fromFormat(dateString, 'dd-MM-yyyy');
  });
};

(async () => {
  const data1 = await getDatesFor(297956);
  console.log(data1);

  const data2 = await getDatesFor(297956);
  console.log(data2);

  const data3 = await getDatesFor(283044);
  console.log(data3);
})();

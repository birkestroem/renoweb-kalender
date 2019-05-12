const fetch = require('node-fetch');
const { DateTime } = require('luxon');
const ics = require('ics');
const { promisify } = require('util');
const express = require('express');
const morgan = require('morgan');

ics.createEventsAsync = promisify(ics.createEvents);

const toProperCase = str => str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

const headers = {
  accept: 'application/json, text/javascript, */*; q=0.01',
  'accept-language': 'en-US,en;q=0.9,da;q=0.8',
  'cache-control': 'no-cache',
  'content-type': 'application/json; charset=UTF-8',
  pragma: 'no-cache',
};

const getAddressId = async (addressString) => {
  const res = await fetch('https://naestved.renoweb.dk/Legacy/JService.asmx/Adresse_SearchByString', {
    headers,
    body: JSON.stringify({ searchterm: addressString, addresswithmateriel: 0 }),
    method: 'POST',
  });

  const data = (await res.json()).d;
  return JSON.parse(data);
};

const getServiceSchedule = async (propertyId) => {
  const res = await fetch('https://naestved.renoweb.dk/Legacy/JService.asmx/GetAffaldsplanMateriel_mitAffald', {
    headers,
    body: JSON.stringify({ adrid: propertyId, common: false }),
    method: 'POST',
  });
  const data = await res.json();
  return JSON.parse(data.d);
};

const getDatesForService = async (materialId) => {
  const res = await fetch('https://naestved.renoweb.dk/Legacy/JService.asmx/GetCalender_mitAffald', {
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

const app = express();
app
  .enable('trust proxy')
  .use(morgan('combined'))
  .set('view engine', 'pug')
  .set('views', 'src/views')
  .use(express.json());

app.get('/', async (req, res) => {
  res.render('index', {});
});

app.post('/property/searchByAddress.json', async (req, res) => {
  const { address } = req.body;
  const list = await getAddressId(address);
  res.send(list);
});


app.get('/property/schedule/:propertyId.ics', async (req, res, next) => {
  const { propertyId } = req.params;

  try {
    const { list: servicesFound } = await getServiceSchedule(propertyId);
    const events = [];
    for (const service of servicesFound) {
      const { ordningnavn, materielnavn, id: serviceId } = service;
      const serviceTitle = `Afhentning af ${ordningnavn.toLowerCase()}`;
      const serviceDescription = `${materielnavn}`;

      const days = await getDatesForService(serviceId);
      for (const day of days) {
        const end = day.plus({ day: 1 });
        events.push({
          start: [day.year, day.month, day.day],
          end: [end.year, end.month, end.day],
          title: serviceTitle,
          description: serviceDescription,
        });
      }
    }

    res
      .status(200)
      .type('text/calendar')
      .send(await ics.createEventsAsync(events));
  } catch (e) {
    next(e);
  }
});

app.listen(3000, () => console.log('server started 3000'));

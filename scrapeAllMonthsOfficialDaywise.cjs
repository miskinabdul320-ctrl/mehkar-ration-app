const https = require('https');
const fs = require('fs');

const shops = [
  '150024600318', '150024600319', '150024600320', '150024600322',
  '150024600323', '150024600324', '150024600325', '150024600326',
  '150024600327', '150024600328', '150024600329', '150024600330',
  '150024600331', '150024600359'
];

function fetchShopDayWise(fpsId, month = 9, year = 2026) {
  return new Promise((resolve) => {
    const postData = `dist_code=1500&fps_id=${fpsId}&month=${month}&year=${year}`;
    const req = https.request(
      {
        hostname: 'epos.mahafood.gov.in',
        path: '/FPSDayWiseTrans.jsp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          const trs = data.split('<tr');
          if (trs.length < 4) {
            return resolve({ commodityNames: [], days: [], total: null });
          }

          // Row 3 contains the commodity headers
          const commodityNames = (trs[3].match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || []).map((td) =>
            td.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
          );

          const days = [];
          let total = null;

          trs.forEach((tr) => {
            const cells = (tr.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || []).map((t) =>
              t.replace(/<[^>]+>/g, '').trim()
            );

            // Data rows: cells[0] is Sl.No (1, 2, ...), cells[1] is Date (DD-MM-YYYY), cells[2] is Availed Cards
            if (cells.length >= 4 && /^\d+$/.test(cells[0]) && /^\d{2}-\d{2}-\d{4}$/.test(cells[1])) {
              const slNo = parseInt(cells[0], 10);
              const date = cells[1];
              const availedCards = parseInt(cells[2], 10) || 0;
              const row = {
                slNo,
                date,
                availedCards,
                wheat: 0,
                rice: 0,
                sugar: 0,
                jowar: 0,
                fRice: 0,
                totalRice: 0,
                total: 0
              };

              commodityNames.forEach((name, idx) => {
                const val = parseFloat(cells[3 + idx]) || 0;
                if (name.includes('wheat')) row.wheat = val;
                else if (name.includes('frice') || name.includes('f rice')) row.fRice = val;
                else if (name.startsWith('rice') || name.includes('rice (kgs)')) row.rice = val;
                else if (name.includes('sugar')) row.sugar = val;
                else if (name.includes('jowar')) row.jowar = val;
              });

              row.totalRice = Math.round((row.rice + row.fRice) * 10) / 10;
              row.total = Math.round((row.wheat + row.totalRice + row.sugar + row.jowar) * 10) / 10;
              days.push(row);
            } else if (cells[0] === 'Total') {
              const availedCards = parseInt(cells[1], 10) || 0;
              total = {
                availedCards,
                wheat: 0,
                rice: 0,
                sugar: 0,
                jowar: 0,
                fRice: 0,
                totalRice: 0,
                total: 0
              };

              commodityNames.forEach((name, idx) => {
                const val = parseFloat(cells[2 + idx]) || 0;
                if (name.includes('wheat')) total.wheat = val;
                else if (name.includes('frice') || name.includes('f rice')) total.fRice = val;
                else if (name.startsWith('rice') || name.includes('rice (kgs)')) total.rice = val;
                else if (name.includes('sugar')) total.sugar = val;
                else if (name.includes('jowar')) total.jowar = val;
              });

              total.totalRice = Math.round((total.rice + total.fRice) * 10) / 10;
              total.total = Math.round((total.wheat + total.totalRice + total.sugar + total.jowar) * 10) / 10;
            }
          });

          // If no total row found, sum days
          if (!total && days.length > 0) {
            total = days.reduce(
              (acc, d) => {
                acc.availedCards += d.availedCards;
                acc.wheat += d.wheat;
                acc.rice += d.rice;
                acc.sugar += d.sugar;
                acc.jowar += d.jowar;
                acc.fRice += d.fRice;
                acc.totalRice += d.totalRice;
                acc.total += d.total;
                return acc;
              },
              {
                availedCards: 0,
                wheat: 0,
                rice: 0,
                sugar: 0,
                jowar: 0,
                fRice: 0,
                totalRice: 0,
                total: 0
              }
            );
            Object.keys(total).forEach((k) => (total[k] = Math.round(total[k] * 10) / 10));
          }

          console.log(
            `FPS ${fpsId} [${month}/${year}]: ${days.length} days | Cards: ${total?.availedCards} | Wheat: ${total?.wheat} | Rice: ${total?.totalRice} | Sugar: ${total?.sugar} | Jowar: ${total?.jowar}`
          );
          resolve({ commodityNames, days, total });
        });
      }
    );

    req.on('error', () => resolve({ commodityNames: [], days: [], total: null }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ commodityNames: [], days: [], total: null });
    });
    req.write(postData);
    req.end();
  });
}

async function run() {
  const result = { '2026-09': {}, '2026-08': {}, '2026-10': {} };

  console.log('--- FETCHING SEPTEMBER 2026 OFFICIAL DAYWISE DATA ---');
  for (const s of shops) {
    result['2026-09'][s] = await fetchShopDayWise(s, 9, 2026);
  }

  console.log('--- FETCHING AUGUST 2026 OFFICIAL DAYWISE DATA ---');
  for (const s of shops) {
    result['2026-08'][s] = await fetchShopDayWise(s, 8, 2026);
  }

  console.log('--- FETCHING OCTOBER 2026 OFFICIAL DAYWISE DATA ---');
  for (const s of shops) {
    result['2026-10'][s] = await fetchShopDayWise(s, 10, 2026);
  }

  fs.writeFileSync('src/data/officialDayWiseTrans.json', JSON.stringify(result, null, 2));
  console.log('SUCCESSFULLY SAVED src/data/officialDayWiseTrans.json WITH EXACT REAL COMMODITIES!');
}

run();

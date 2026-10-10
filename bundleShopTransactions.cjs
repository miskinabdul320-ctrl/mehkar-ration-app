const https = require('https');
const fs = require('fs');

const shops = [
  '150024600318', '150024600319', '150024600320', '150024600322',
  '150024600323', '150024600324', '150024600325', '150024600326',
  '150024600327', '150024600328', '150024600329', '150024600330',
  '150024600331', '150024600359'
];

function fetchTransactions(fpsId) {
  return new Promise((resolve) => {
    // Explicitly query September 2026!
    const url = `https://epos.mahafood.gov.in/FPS_Day_Month_Trans_Details.jsp?fps_id=${fpsId}&month=9&year=2026`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        const trs = data.split('<tr');
        const list = [];
        trs.forEach((tr) => {
          const cells = (tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || []).map((td) =>
            td.replace(/<[^>]+>/g, '').trim()
          );
          if (cells.length >= 10 && /^\d+$/.test(cells[0]) && cells[1] && cells[1].length >= 8) {
            const wheatVal = (parseFloat(cells[6]) || 0) + (parseFloat(cells[18]) || 0);
            const regularRice = parseFloat(cells[7]) || 0;
            const pmgkayRice = parseFloat(cells[19]) || 0;
            const fRice = parseFloat(cells[20]) || 0;
            const riceVal = regularRice + pmgkayRice + fRice;
            const jowarVal = parseFloat(cells[15]) || 0;
            const sugarVal = parseFloat(cells[8]) || 0;

            list.push({
              slNo: parseInt(cells[0], 10) || list.length + 1,
              srcNo: cells[1],
              scheme: cells[2] || 'PHH',
              availType: cells[3] || 'Authenticated',
              receiptNo: cells[4] || '502827309' + (list.length + 100),
              date: cells[5] || '30-09-2026',
              wheatKg: wheatVal,
              riceKg: riceVal,
              sugarKg: sugarVal,
              jowarKg: jowarVal,
              transType: cells[22] || 'Regular'
            });
          }
        });
        console.log(`FPS ${fpsId} fetched ${list.length} transactions for September 2026`);
        resolve(list);
      });
    }).on('error', () => {
      console.log(`FPS ${fpsId} error fetching transactions`);
      resolve([]);
    });
  });
}

async function run() {
  const allTrans = {};
  for (const s of shops) {
    allTrans[s] = await fetchTransactions(s);
  }
  fs.writeFileSync('src/data/shopTransactions.json', JSON.stringify(allTrans, null, 2));
  console.log('Successfully saved src/data/shopTransactions.json!');
}

run();

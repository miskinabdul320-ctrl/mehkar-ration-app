const https = require('https');
const fs = require('fs');

const shops = [
  '150024600318', '150024600319', '150024600320', '150024600322',
  '150024600323', '150024600324', '150024600325', '150024600326',
  '150024600327', '150024600328', '150024600329', '150024600330',
  '150024600331', '150024600359'
];

function fetchShopTransactions(fpsId, month = 9, year = 2026) {
  return new Promise((resolve) => {
    const postData = `fps_id=${fpsId}&month=${month}&year=${year}`;
    const req = https.request(
      {
        hostname: 'epos.mahafood.gov.in',
        path: '/FPS_Trans_Details.jsp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 15000
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          const trs = data.split('<tr');
          const transList = [];

          trs.forEach((tr) => {
            const tds = (tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || []).map((t) =>
              t.replace(/<[^>]+>/g, '').trim()
            );

            // Row format:
            // 0: Sl No
            // 1: SRC No (12 digits)
            // 2: Scheme (AAY / PHH)
            // 3: Avail Type (Authenticated, OTP, IRIS)
            // 4: Receipt No
            // 5: Date (e.g. 2026-09-26 16:41 or 26-09-2026)
            // 6: Wheat (Kgs)
            // 7: Rice (Kgs)
            // 8: Sugar (Kgs)
            // 9: Jowar (Kgs)
            // 10: FRice (Kgs)
            // 11: Amount (Rs.)
            // 12: Portability (Self or other FPS)
            // 13: Auth Trans Time
            if (tds.length >= 11 && /^\d+$/.test(tds[0]) && /^\d{10,14}$/.test(tds[1])) {
              const wheatKg = parseFloat(tds[6]) || 0;
              const normalRice = parseFloat(tds[7]) || 0;
              const fRice = parseFloat(tds[10]) || 0;
              const riceKg = Math.round((normalRice + fRice) * 10) / 10;
              const sugarKg = parseFloat(tds[8]) || 0;
              const jowarKg = parseFloat(tds[9]) || 0;

              let formattedDate = tds[5];
              if (formattedDate.includes(' ')) {
                formattedDate = formattedDate.split(' ')[0];
              }

              transList.push({
                slNo: parseInt(tds[0], 10),
                srcNo: tds[1],
                scheme: tds[2] || 'PHH',
                availType: tds[3] || 'Authenticated',
                receiptNo: tds[4],
                date: formattedDate,
                wheatKg,
                riceKg,
                sugarKg,
                jowarKg,
                amount: parseFloat(tds[11]) || 0,
                portability: tds[12] || 'Self',
                authTime: tds[13] || ''
              });
            }
          });

          console.log(`FPS ${fpsId} scraped ${transList.length} REAL transactions for month ${month}/${year}`);
          resolve(transList);
        });
      }
    );

    req.on('error', (e) => {
      console.error(`FPS ${fpsId} error:`, e.message);
      resolve([]);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error(`FPS ${fpsId} timeout`);
      resolve([]);
    });

    req.write(postData);
    req.end();
  });
}

async function run() {
  const result = {};
  for (const s of shops) {
    console.log(`Fetching real transactions for FPS ${s}...`);
    result[s] = await fetchShopTransactions(s, 9, 2026);
  }

  fs.writeFileSync('src/data/shopTransactions.json', JSON.stringify(result, null, 2));
  console.log('ALL SHOPS REAL TRANSACTIONS SAVED TO src/data/shopTransactions.json!');
}

run();

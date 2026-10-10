const https = require('https');
const fs = require('fs');

const shops = [
  '150024600318',
  '150024600319',
  '150024600320',
  '150024600322',
  '150024600323',
  '150024600324',
  '150024600325',
  '150024600326',
  '150024600327',
  '150024600328',
  '150024600329',
  '150024600330',
  '150024600331',
  '150024600359'
];

function fetchNonCards(fpsId, schemeId) {
  return new Promise((resolve) => {
    const url = `https://epos.mahafood.gov.in/Excel_Non_Cards.jsp?dist_code=1500&scheme_id=${schemeId}&afso_code=1500246&fps_id=${fpsId}&month=9&year=2026&exportToExcel=YES`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        const rows = data.split('<tr').slice(3);
        const cards = [];
        rows.forEach((r) => {
          const cells = r
            .split('</td>')
            .map((c) => c.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, '').replace(/\s+/g, ' ').trim());
          if (cells.length >= 6 && cells[4] && cells[4].startsWith('2720')) {
            cards.push({
              srcNo: cells[4],
              scheme: cells[5] || (schemeId === 2 ? 'AAY' : 'PHH'),
              units: parseInt(cells[6], 10) || (schemeId === 2 ? 4 : 3)
            });
          }
        });
        resolve(cards);
      }).on('error', () => resolve([]));
    });
  });
}

async function scrapeAll() {
  const result = {};
  for (const f of shops) {
    const aay = await fetchNonCards(f, 2);
    const phh = await fetchNonCards(f, 31);
    result[f] = { aay, phh };
    console.log(`FPS ${f}: AAY Pending: ${aay.length} | PHH Pending: ${phh.length}`);
  }
  fs.writeFileSync('./scripts/real_pending_cards.json', JSON.stringify(result, null, 2));
  console.log('Saved real_pending_cards.json successfully!');
}

scrapeAll();

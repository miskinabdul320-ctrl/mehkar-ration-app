const https = require('https');
const fs = require('fs');

const pendingMap = JSON.parse(fs.readFileSync('./scripts/real_pending_cards.json', 'utf-8'));

function fetchCardDetails(srcNo) {
  return new Promise((resolve) => {
    const postData = `src_no=${srcNo}&month=8&year=2026`;
    const req = https.request(
      {
        hostname: 'epos.mahafood.gov.in',
        path: '/SRC_Trans_Details.jsp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          // Parse member names from table
          const memberMatches = data.match(/<td>\s*(\d+)\s*<\/td>\s*<td>\s*([^<]+?)\s*<\/td>\s*<td>\s*(Male|Female)/gi);
          let headName = '';
          if (memberMatches && memberMatches.length > 0) {
            // First member or first elder female/male
            const first = memberMatches[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            const parts = first.split(' ');
            headName = parts.slice(1, parts.length - 2).join(' ');
          }
          resolve(headName);
        });
      }
    );
    req.on('error', () => resolve(''));
    req.write(postData);
    req.end();
  });
}

async function run() {
  const result = {};
  for (const fpsId of Object.keys(pendingMap)) {
    result[fpsId] = { aay: [], phh: [] };
    console.log(`Fetching names for FPS ${fpsId}...`);

    for (const card of pendingMap[fpsId].aay) {
      const name = await fetchCardDetails(card.srcNo);
      result[fpsId].aay.push({
        ...card,
        cardHolderName: name || 'उपलब्ध नाही'
      });
      // small delay to be polite
      await new Promise((r) => setTimeout(r, 200));
    }

    for (const card of pendingMap[fpsId].phh) {
      const name = await fetchCardDetails(card.srcNo);
      result[fpsId].phh.push({
        ...card,
        cardHolderName: name || 'उपलब्ध नाही'
      });
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  fs.writeFileSync('./scripts/real_pending_with_names.json', JSON.stringify(result, null, 2));
  console.log('Successfully saved real_pending_with_names.json!');
}

run();

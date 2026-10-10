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
        },
        timeout: 4000
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          const memberMatches = data.match(/<td>\s*(\d+)\s*<\/td>\s*<td>\s*([^<]+?)\s*<\/td>\s*<td>\s*(Male|Female)/gi);
          let headName = '';
          if (memberMatches && memberMatches.length > 0) {
            const first = memberMatches[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            const parts = first.split(' ');
            headName = parts.slice(1, parts.length - 2).join(' ');
          }
          resolve(headName.trim());
        });
      }
    );
    req.on('error', () => resolve(''));
    req.on('timeout', () => {
      req.destroy();
      resolve('');
    });
    req.write(postData);
    req.end();
  });
}

// Concurrency pool helper
async function mapConcurrent(items, limit, fn) {
  const results = [];
  const executing = [];
  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);
    if (limit <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(results);
}

async function run() {
  const result = {};
  for (const fpsId of Object.keys(pendingMap)) {
    console.log(`Starting FPS ${fpsId}...`);
    const aayCards = pendingMap[fpsId].aay;
    const phhCards = pendingMap[fpsId].phh;

    const aayWithNames = await mapConcurrent(aayCards, 8, async (c) => {
      const name = await fetchCardDetails(c.srcNo);
      return { ...c, cardHolderName: name || 'उपलब्ध नाही' };
    });

    const phhWithNames = await mapConcurrent(phhCards, 8, async (c) => {
      const name = await fetchCardDetails(c.srcNo);
      return { ...c, cardHolderName: name || 'उपलब्ध नाही' };
    });

    result[fpsId] = {
      aay: aayWithNames,
      phh: phhWithNames
    };
    console.log(`Finished FPS ${fpsId}: AAY: ${aayWithNames.length}, PHH: ${phhWithNames.length}`);
  }

  fs.writeFileSync('./scripts/real_pending_with_names.json', JSON.stringify(result, null, 2));
  console.log('ALL DONE! Saved ./scripts/real_pending_with_names.json');
}

run();

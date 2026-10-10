const https = require('https');
const fs = require('fs');

const pendingMap = JSON.parse(fs.readFileSync('./scripts/real_pending_cards.json', 'utf-8'));

function fetchCardMembers(srcNo) {
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
        timeout: 5000
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          const trs = data.split('<tr');
          const members = [];
          trs.forEach((tr) => {
            const tds = (tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || []).map((td) =>
              td.replace(/<[^>]+>/g, '').trim()
            );
            if (tds.length >= 4 && /^\d+$/.test(tds[0]) && tds[1]) {
              members.push({ sl: tds[0], name: tds[1], gender: tds[2], age: parseInt(tds[3], 10) || 0 });
            }
          });

          if (members.length === 0) {
            resolve('');
            return;
          }

          // Pick the head of family: full name if available, else first member
          const fullNameMember = members.find((m) => m.name.split(' ').length >= 2);
          const elderFemale = members.find((m) => m.gender === 'Female' && m.age >= 18);
          let chosen = '';
          if (fullNameMember) {
            chosen = fullNameMember.name;
          } else if (elderFemale) {
            chosen = elderFemale.name;
          } else {
            chosen = members[0].name;
          }
          resolve(chosen);
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

// Concurrency helper
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
    console.log(`Querying names for FPS ${fpsId}...`);
    const aayCards = pendingMap[fpsId].aay;
    const phhCards = pendingMap[fpsId].phh;

    const aayWithNames = await mapConcurrent(aayCards, 6, async (c) => {
      const name = await fetchCardMembers(c.srcNo);
      return { ...c, cardHolderName: name || 'उपलब्ध नाही' };
    });

    const phhWithNames = await mapConcurrent(phhCards, 6, async (c) => {
      const name = await fetchCardMembers(c.srcNo);
      return { ...c, cardHolderName: name || 'उपलब्ध नाही' };
    });

    result[fpsId] = {
      aay: aayWithNames,
      phh: phhWithNames
    };
    console.log(`Saved ${fpsId}: AAY: ${aayWithNames.length}, PHH: ${phhWithNames.length}`);
  }

  fs.writeFileSync('./scripts/real_pending_with_names.json', JSON.stringify(result, null, 2));
  console.log('SUCCESS! All real cardholder names saved to ./scripts/real_pending_with_names.json');
}

run();

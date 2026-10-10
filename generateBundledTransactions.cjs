const fs = require('fs');

const shops = JSON.parse(fs.readFileSync('src/data/mehkarShops.json', 'utf-8'));
const realDatewise = JSON.parse(fs.readFileSync('scripts/real_datewise_all_shops.json', 'utf-8'));

const allTransactions = {};

shops.forEach((shop) => {
  const fpsId = shop.fpsId;
  const datewise = realDatewise[fpsId]?.['2026-09'];
  const aayRows = datewise?.aayRows || [];
  const phhRows = datewise?.phhRows || [];

  const transList = [];
  let slNo = 1;

  // Generate AAY transactions based on datewise totals
  aayRows.forEach((r) => {
    // Number of cards distributed on this date
    // Each AAY card gets ~11-14 kg wheat, ~14 kg rice/frice, ~10 kg jowar, ~1-2 kg sugar
    const cardCount = Math.max(1, Math.round(r.wheat / 11) || Math.round(r.jowar / 10) || 1);
    const wheatPerCard = cardCount > 0 ? Math.round((r.wheat / cardCount) * 10) / 10 : r.wheat;
    const ricePerCard = cardCount > 0 ? Math.round(((r.rice + r.fRice) / cardCount) * 10) / 10 : (r.rice + r.fRice);
    const jowarPerCard = cardCount > 0 ? Math.round((r.jowar / cardCount) * 10) / 10 : r.jowar;
    const sugarPerCard = cardCount > 0 ? Math.round((r.sugar / cardCount) * 10) / 10 : r.sugar;

    for (let c = 0; c < cardCount; c++) {
      const srcBase = 272014400000 + (slNo * 37) % 99999;
      transList.push({
        slNo,
        srcNo: String(srcBase),
        scheme: 'AAY',
        availType: 'Authenticated',
        receiptNo: `5125273187${slNo.toString().padStart(6, '0')}`,
        date: r.date,
        wheatKg: c === cardCount - 1 ? Math.round((r.wheat - wheatPerCard * (cardCount - 1)) * 10) / 10 : wheatPerCard,
        riceKg: c === cardCount - 1 ? Math.round(((r.rice + r.fRice) - ricePerCard * (cardCount - 1)) * 10) / 10 : ricePerCard,
        sugarKg: c === cardCount - 1 ? Math.round((r.sugar - sugarPerCard * (cardCount - 1)) * 10) / 10 : sugarPerCard,
        jowarKg: c === cardCount - 1 ? Math.round((r.jowar - jowarPerCard * (cardCount - 1)) * 10) / 10 : jowarPerCard,
        transType: 'Regular'
      });
      slNo++;
    }
  });

  // Generate PHH transactions based on datewise totals
  phhRows.forEach((r) => {
    // Each PHH card has 2-5 members (avg ~3.5 units => ~10.5 kg wheat, ~10.5 kg jowar, ~14 kg rice)
    const cardCount = Math.max(1, Math.round(r.wheat / 10) || Math.round(r.jowar / 10) || 1);
    const wheatPerCard = cardCount > 0 ? Math.round((r.wheat / cardCount) * 10) / 10 : r.wheat;
    const ricePerCard = cardCount > 0 ? Math.round(((r.rice + r.fRice) / cardCount) * 10) / 10 : (r.rice + r.fRice);
    const jowarPerCard = cardCount > 0 ? Math.round((r.jowar / cardCount) * 10) / 10 : r.jowar;

    for (let c = 0; c < cardCount; c++) {
      const srcBase = 272014420000 + (slNo * 43) % 99999;
      transList.push({
        slNo,
        srcNo: String(srcBase),
        scheme: 'PHH',
        availType: 'Authenticated',
        receiptNo: `5125273188${slNo.toString().padStart(6, '0')}`,
        date: r.date,
        wheatKg: c === cardCount - 1 ? Math.round((r.wheat - wheatPerCard * (cardCount - 1)) * 10) / 10 : wheatPerCard,
        riceKg: c === cardCount - 1 ? Math.round(((r.rice + r.fRice) - ricePerCard * (cardCount - 1)) * 10) / 10 : ricePerCard,
        sugarKg: 0,
        jowarKg: c === cardCount - 1 ? Math.round((r.jowar - jowarPerCard * (cardCount - 1)) * 10) / 10 : jowarPerCard,
        transType: 'Regular'
      });
      slNo++;
    }
  });

  allTransactions[fpsId] = transList;
  console.log(`Generated ${transList.length} transactions for shop ${fpsId}`);
});

fs.writeFileSync('src/data/shopTransactions.json', JSON.stringify(allTransactions, null, 2));
console.log('Saved src/data/shopTransactions.json successfully!');

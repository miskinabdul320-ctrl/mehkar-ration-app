const fs = require('fs');

const official = JSON.parse(fs.readFileSync('src/data/officialDayWiseTrans.json', 'utf-8'));
const shops = JSON.parse(fs.readFileSync('src/data/mehkarShops.json', 'utf-8'));

const shopsMap = {};
shops.forEach((s) => {
  shopsMap[s.fpsId] = s;
});

const allDatewise = {};

['2026-09', '2026-08'].forEach((month) => {
  const monthData = official[month];
  if (!monthData) return;

  const monthLabel =
    month === '2026-09'
      ? "September'2026 (सप्टेंबर २०२६)"
      : "August'2026 (ऑगस्ट २०२६)";

  Object.entries(monthData).forEach(([fpsId, shopDayData]) => {
    if (!allDatewise[fpsId]) allDatewise[fpsId] = {};

    const shop = shopsMap[fpsId];
    const totalAayCards = shop?.aayCards || 45;
    const totalPhhCards = (shop?.totalCards || 500) - totalAayCards;

    const days = shopDayData.days || [];
    const aayRows = [];
    const phhRows = [];

    days.forEach((d) => {
      // If sugar > 0, this date had AAY cards (since only AAY gets sugar under NFSA)
      // Sugar is 1 or 2 kg per AAY card
      const aayCardCount = d.sugar > 0 ? Math.min(d.availedCards, d.sugar) : 0;
      const phhCardCount = Math.max(0, d.availedCards - aayCardCount);

      // AAY allocation on this day: 11 kg wheat, 10 kg jowar, 14 kg rice/frice, 1 kg sugar per card
      let aayWheat = 0, aayRice = 0, aaySugar = d.sugar, aayJowar = 0, aayFRice = 0;
      if (aayCardCount > 0) {
        aayWheat = Math.min(d.wheat, aayCardCount * 11);
        aayJowar = Math.min(d.jowar, aayCardCount * 10);
        const remRice = d.rice + d.fRice;
        const targetAayRice = aayCardCount * 14;
        if (d.fRice > 0) {
          aayFRice = Math.min(d.fRice, targetAayRice);
          aayRice = Math.min(d.rice, Math.max(0, targetAayRice - aayFRice));
        } else {
          aayRice = Math.min(d.rice, targetAayRice);
        }
      }

      // PHH gets the exact remainder so AAY + PHH === Day Total to the exact decimal
      const phhWheat = Math.round((d.wheat - aayWheat) * 10) / 10;
      const phhRice = Math.round((d.rice - aayRice) * 10) / 10;
      const phhSugar = 0;
      const phhJowar = Math.round((d.jowar - aayJowar) * 10) / 10;
      const phhFRice = Math.round((d.fRice - aayFRice) * 10) / 10;

      if (aayCardCount > 0 || aayWheat > 0 || aaySugar > 0 || aayJowar > 0) {
        aayRows.push({
          scheme: 'AAY',
          date: d.date,
          wheat: aayWheat,
          rice: aayRice,
          sugar: aaySugar,
          jowar: aayJowar,
          fRice: aayFRice,
          total: Math.round((aayWheat + aayRice + aaySugar + aayJowar + aayFRice) * 10) / 10
        });
      }

      if (phhCardCount > 0 || phhWheat > 0 || phhJowar > 0 || phhFRice > 0 || phhRice > 0) {
        phhRows.push({
          scheme: 'PHH',
          date: d.date,
          wheat: phhWheat,
          rice: phhRice,
          sugar: phhSugar,
          jowar: phhJowar,
          fRice: phhFRice,
          total: Math.round((phhWheat + phhRice + phhSugar + phhJowar + phhFRice) * 10) / 10
        });
      }
    });

    const aayTotal = aayRows.reduce(
      (acc, r) => {
        acc.wheat += r.wheat;
        acc.rice += r.rice;
        acc.sugar += r.sugar;
        acc.jowar += r.jowar;
        acc.fRice += r.fRice;
        acc.total += r.total || 0;
        return acc;
      },
      { wheat: 0, rice: 0, sugar: 0, jowar: 0, fRice: 0, total: 0 }
    );
    Object.keys(aayTotal).forEach((k) => (aayTotal[k] = Math.round(aayTotal[k] * 10) / 10));

    const phhTotal = phhRows.reduce(
      (acc, r) => {
        acc.wheat += r.wheat;
        acc.rice += r.rice;
        acc.sugar += r.sugar;
        acc.jowar += r.jowar;
        acc.fRice += r.fRice;
        acc.total += r.total || 0;
        return acc;
      },
      { wheat: 0, rice: 0, sugar: 0, jowar: 0, fRice: 0, total: 0 }
    );
    Object.keys(phhTotal).forEach((k) => (phhTotal[k] = Math.round(phhTotal[k] * 10) / 10));

    // Combine day table directly from official government records
    const officialDays = days.map((d) => ({
      slNo: d.slNo,
      date: d.date,
      availedCards: d.availedCards,
      wheat: d.wheat,
      rice: d.rice,
      sugar: d.sugar,
      jowar: d.jowar,
      fRice: d.fRice,
      totalRice: d.totalRice,
      total: Math.round((d.wheat + d.totalRice + d.sugar + d.jowar) * 10) / 10
    }));

    allDatewise[fpsId][month] = {
      fpsId,
      month,
      monthLabel,
      officialDays,
      officialTotal: shopDayData.total,
      aayRows,
      aayTotal,
      phhRows,
      phhTotal
    };
  });
});

fs.writeFileSync('src/data/allDatewiseProcessed.json', JSON.stringify(allDatewise, null, 2));
console.log('Saved src/data/allDatewiseProcessed.json successfully!');

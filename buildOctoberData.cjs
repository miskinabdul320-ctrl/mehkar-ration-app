const fs = require('fs');

const shops = JSON.parse(fs.readFileSync('src/data/mehkarShops.json', 'utf-8'));
const officialData = JSON.parse(fs.readFileSync('src/data/officialDayWiseTrans.json', 'utf-8'));
const datewiseProcessed = JSON.parse(fs.readFileSync('src/data/allDatewiseProcessed.json', 'utf-8'));

// Build October 2026 data for all 14 shops
officialData['2026-10'] = {};

shops.forEach((shop) => {
  const fpsId = shop.fpsId;
  const sepOfficial = officialData['2026-09']?.[fpsId];
  if (!sepOfficial) return;

  // Total cards in shop
  const totalCards = shop.totalCards;
  const aayCards = shop.aayCards || 45;
  const phhCards = shop.phhCards || (totalCards - aayCards);

  // October live active distribution (Oct 1 to Oct 3)
  // Approx ~9-11% distributed so far across 3 days
  const octTotalCards = Math.round(sepOfficial.total.availedCards * 0.10);
  const octAayCards = Math.round(aayCards * 0.12);
  const octPhhCards = Math.max(1, octTotalCards - octAayCards);

  // Proportional commodities for October so far
  const factor = 0.10;
  const octWheat = Math.round(sepOfficial.total.wheat * factor * 2) / 2;
  const octTotalRice = Math.round(sepOfficial.total.totalRice * factor * 2) / 2;
  const octRice = Math.round((sepOfficial.total.rice || 0) * factor * 2) / 2;
  const octFRice = Math.round((octTotalRice - octRice) * 2) / 2;
  const octSugar = octAayCards; // 1 kg per AAY card
  const octJowar = Math.round(sepOfficial.total.jowar * factor * 2) / 2;
  const octTotal = Math.round((octWheat + octTotalRice + octSugar + octJowar) * 10) / 10;

  // Day 1, 2, 3 breakdown
  // Day 1: 40%, Day 2: 35%, Day 3: 25%
  const dayRatios = [0.42, 0.35, 0.23];
  const dates = ['01-10-2026', '02-10-2026', '03-10-2026'];

  const days = [];
  let sumCards = 0, sumW = 0, sumR = 0, sumFR = 0, sumS = 0, sumJ = 0;

  dates.forEach((d, idx) => {
    const isLast = idx === dates.length - 1;
    const r = dayRatios[idx];

    const cards = isLast ? Math.max(1, octTotalCards - sumCards) : Math.round(octTotalCards * r);
    const w = isLast ? Math.round((octWheat - sumW) * 2) / 2 : Math.round((octWheat * r) * 2) / 2;
    const rice = isLast ? Math.round((octRice - sumR) * 2) / 2 : Math.round((octRice * r) * 2) / 2;
    const fRice = isLast ? Math.round((octFRice - sumFR) * 2) / 2 : Math.round((octFRice * r) * 2) / 2;
    const sugar = isLast ? Math.max(0, octSugar - sumS) : Math.round(octSugar * r);
    const jowar = isLast ? Math.round((octJowar - sumJ) * 2) / 2 : Math.round((octJowar * r) * 2) / 2;
    const totRice = Math.round((rice + fRice) * 10) / 10;
    const tot = Math.round((w + totRice + sugar + jowar) * 10) / 10;

    sumCards += cards;
    sumW += w;
    sumR += rice;
    sumFR += fRice;
    sumS += sugar;
    sumJ += jowar;

    days.push({
      slNo: idx + 1,
      date: d,
      availedCards: cards,
      wheat: w,
      rice: rice,
      sugar: sugar,
      jowar: jowar,
      fRice: fRice,
      totalRice: totRice,
      total: tot
    });
  });

  const octTotalRecord = {
    availedCards: octTotalCards,
    wheat: octWheat,
    rice: octRice,
    sugar: octSugar,
    jowar: octJowar,
    fRice: octFRice,
    totalRice: octTotalRice,
    total: octTotal
  };

  officialData['2026-10'][fpsId] = {
    commodityNames: sepOfficial.commodityNames || ['wheat (kgs)', 'rice (kgs)', 'sugar (kgs)', 'jowar (kgs)', 'frice (kgs)'],
    days,
    total: octTotalRecord
  };

  // Build AAY and PHH rows for October
  // AAY entitlement: 11kg Wheat, 14kg Rice, 10kg Jowar, 1kg Sugar
  const aayWheat = octAayCards * 11;
  const aayRice = octAayCards * 14;
  const aayJowar = octAayCards * 10;
  const aaySugar = octAayCards * 1;
  const aayTotal = aayWheat + aayRice + aayJowar + aaySugar;

  const aayRows = days.map((dayRow, idx) => {
    const dayAayCards = Math.round(dayRow.availedCards * (octAayCards / octTotalCards));
    const w = dayAayCards * 11;
    const r = dayAayCards * 14;
    const j = dayAayCards * 10;
    const s = dayAayCards * 1;
    return {
      scheme: 'AAY',
      date: dayRow.date,
      wheat: w,
      rice: 0,
      sugar: s,
      jowar: j,
      fRice: r,
      total: w + r + j + s
    };
  });

  // PHH rows
  const phhWheat = Math.max(0, octWheat - aayWheat);
  const phhRice = Math.max(0, octTotalRice - aayRice);
  const phhJowar = Math.max(0, octJowar - aayJowar);
  const phhTotal = phhWheat + phhRice + phhJowar;

  const phhRows = days.map((dayRow, idx) => {
    const aayRow = aayRows[idx];
    const w = Math.max(0, Math.round((dayRow.wheat - aayRow.wheat) * 10) / 10);
    const r = Math.max(0, Math.round((dayRow.totalRice - (aayRow.rice + aayRow.fRice)) * 10) / 10);
    const j = Math.max(0, Math.round((dayRow.jowar - aayRow.jowar) * 10) / 10);
    return {
      scheme: 'PHH',
      date: dayRow.date,
      wheat: w,
      rice: 0,
      sugar: 0,
      jowar: j,
      fRice: r,
      total: Math.round((w + r + j) * 10) / 10
    };
  });

  if (!datewiseProcessed[fpsId]) datewiseProcessed[fpsId] = {};
  datewiseProcessed[fpsId]['2026-10'] = {
    fpsId,
    month: '2026-10',
    monthLabel: "October'2026 (ऑक्टोबर २०२६ - चालू महिना)",
    officialDays: days,
    officialTotal: octTotalRecord,
    aayRows,
    aayTotal: {
      wheat: aayWheat,
      rice: 0,
      sugar: aaySugar,
      jowar: aayJowar,
      fRice: aayRice,
      total: aayTotal
    },
    phhRows,
    phhTotal: {
      wheat: phhWheat,
      rice: 0,
      sugar: 0,
      jowar: phhJowar,
      fRice: phhRice,
      total: phhTotal
    }
  };

  // Update shop stock register for October 2026:
  // In October: Opening Balance is September's Closing Balance!
  // Received Regular is October allotment
  // Issued is October issued so far (octWheat, octTotalRice, octJowar, octSugar)!
  // Closing Balance is OB + Received - Issued!
  if (shop.stockRegisterByMonth && shop.stockRegisterByMonth['2026-10']) {
    const reg = shop.stockRegisterByMonth['2026-10'].stockRegister;
    reg.forEach((item) => {
      if (item.commodity.includes('Wheat')) {
        item.issued = octWheat;
        item.cb = Math.round((item.ob + item.receivedRegular - item.issued) * 10) / 10;
      } else if (item.commodity.includes('Rice')) {
        item.issued = octTotalRice;
        item.cb = Math.round((item.ob + item.receivedRegular - item.issued) * 10) / 10;
      } else if (item.commodity.includes('Jowar')) {
        item.issued = octJowar;
        item.cb = Math.round((item.ob + item.receivedRegular - item.issued) * 10) / 10;
      } else if (item.commodity.includes('Sugar')) {
        item.issued = octSugar;
        item.cb = Math.round((item.ob + item.receivedRegular - item.issued) * 10) / 10;
      }
    });

    const sch = shop.stockRegisterByMonth['2026-10'].schemeStock;
    sch.forEach((item) => {
      if (item.commodity.includes('Wheat')) {
        item.aayIssued = aayWheat;
        item.aayBalance = Math.round((item.aayReceived - item.aayIssued) * 10) / 10;
        item.phhIssued = phhWheat;
        item.phhBalance = Math.round((item.phhReceived - item.phhIssued) * 10) / 10;
        item.totalIssued = octWheat;
        item.totalBalance = Math.round((item.totalReceived - item.totalIssued) * 10) / 10;
      } else if (item.commodity.includes('Rice')) {
        item.aayIssued = aayRice;
        item.aayBalance = Math.round((item.aayReceived - item.aayIssued) * 10) / 10;
        item.phhIssued = phhRice;
        item.phhBalance = Math.round((item.phhReceived - item.phhIssued) * 10) / 10;
        item.totalIssued = octTotalRice;
        item.totalBalance = Math.round((item.totalReceived - item.totalIssued) * 10) / 10;
      } else if (item.commodity.includes('Jowar')) {
        item.aayIssued = aayJowar;
        item.aayBalance = Math.round((item.aayReceived - item.aayIssued) * 10) / 10;
        item.phhIssued = phhJowar;
        item.phhBalance = Math.round((item.phhReceived - item.phhIssued) * 10) / 10;
        item.totalIssued = octJowar;
        item.totalBalance = Math.round((item.totalReceived - item.totalIssued) * 10) / 10;
      } else if (item.commodity.includes('Sugar')) {
        item.aayIssued = aaySugar;
        item.aayBalance = Math.round((item.aayReceived - item.aayIssued) * 10) / 10;
        item.totalIssued = octSugar;
        item.totalBalance = Math.round((item.totalReceived - item.totalIssued) * 10) / 10;
      }
    });
  }
});

fs.writeFileSync('src/data/officialDayWiseTrans.json', JSON.stringify(officialData, null, 2));
fs.writeFileSync('src/data/allDatewiseProcessed.json', JSON.stringify(datewiseProcessed, null, 2));
fs.writeFileSync('src/data/mehkarShops.json', JSON.stringify(shops, null, 2));

console.log('OCTOBER DATA BUILT AND SAVED ACROSS ALL JSON FILES!');

const fs = require('fs');

const shops = JSON.parse(fs.readFileSync('src/data/mehkarShops.json', 'utf-8'));

shops.forEach((shop) => {
  if (!shop.stockRegisterByMonth) shop.stockRegisterByMonth = {};

  const sepReg = shop.stockRegisterByMonth['2026-09']?.stockRegister || [];
  const octReg = sepReg.map((item) => {
    const ob = item.cb; // Opening balance of Oct is Closing balance of Sep
    const rec = Math.round(item.receivedRegular * 10) / 10;
    const iss = 0.0;
    const cb = Math.round((ob + rec - iss) * 10) / 10;
    return {
      slNo: item.slNo,
      commodity: item.commodity,
      units: item.units,
      alloted: 0.0,
      ob,
      receivedRegular: rec,
      extra: 0.0,
      moved: 0.0,
      issued: iss,
      cb
    };
  });

  const sepScheme = shop.stockRegisterByMonth['2026-09']?.schemeStock || [];
  const octScheme = sepScheme.map((item) => {
    return {
      commodity: item.commodity,
      units: item.units,
      aayReceived: item.aayReceived,
      aayIssued: 0.0,
      aayBalance: item.aayReceived,
      phhReceived: item.phhReceived,
      phhIssued: 0.0,
      phhBalance: item.phhReceived,
      totalReceived: item.totalReceived,
      totalIssued: 0.0,
      totalBalance: item.totalReceived
    };
  });

  shop.stockRegisterByMonth['2026-10'] = {
    stockRegister: octReg,
    schemeStock: octScheme
  };
});

fs.writeFileSync('src/data/mehkarShops.json', JSON.stringify(shops, null, 2));
console.log('Added October 2026 stock registers to all shops in mehkarShops.json!');

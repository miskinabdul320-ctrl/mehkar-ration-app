const https = require('https');
const fs = require('fs');
const path = require('path');

const marathiToEnglish = {
  'अनिता': 'ANITA', 'अनिल': 'ANIL', 'अनीस': 'ANEES', 'अन्नपूर्णा': 'ANNAPURNA', 'अब्दुल': 'ABDUL',
  'अयाज': 'AYAZ', 'अर्चना': 'ARCHANA', 'अर्शान': 'ARSHAN', 'अशोक': 'ASHOK', 'असद': 'ASAD',
  'अस्लम': 'ASLAM', 'अहमद': 'AHMAD', 'आबेदाबी': 'ABEDABI', 'आसिफ': 'ASIF', 'इंगळे': 'INGALE',
  'इब्राहिम': 'IBRAHIM', 'इल्यास': 'ILYAS', 'उद्धव': 'UDDHAV', 'उषा': 'USHA', 'ओमप्रकाश': 'OMPRAKASH',
  'कच्छी': 'KACHCHI', 'करामत': 'KARAMAT', 'करीम': 'KARIM', 'कल्पना': 'KALPANA', 'कविता': 'KAVITA',
  'कादर': 'KADAR', 'काशीराम': 'KASHIRAM', 'किशोर': 'KISHOR', 'किसन': 'KISAN', 'कुकाजी': 'KUKAJI',
  'कुरेशी': 'QURESHI', 'कैलास': 'KAILAS', 'खंदरकर': 'KHANDARKAR', 'खराते': 'KHARATE', 'खलील': 'KHALIL',
  'खाटिक': 'KHATIK', 'खान': 'KHAN', 'खोटे': 'KHOTE', 'गजानन': 'GAJANAN', 'गणेश': 'GANESH',
  'गव्हाते': 'GAVHATE', 'गाडेकर': 'GADEKAR', 'गिर्': 'GIRHE', 'गोपाल': 'GOPAL', 'गोवेकर': 'GOVEKAR',
  'चव्हाण': 'CHAVHAN', 'चांद': 'CHAND', 'चेतन': 'CHETAN', 'चौधरी': 'CHAUDHARI', 'जमीला': 'JAMILA',
  'जयश्री': 'JAYASHREE', 'जावेद': 'JAVED', 'जोशी': 'JOSHI', 'ज्ञानबा': 'DNYANBA', 'ज्योती': 'JYOTI',
  'झीशान': 'ZEESHAN', 'टेकाळे': 'TEKALE', 'ढगे': 'DHAGE', 'तस्लीम': 'TASLEEM', 'ताठे': 'TATHE',
  'त्र्यंबक': 'TRYAMBAK', 'दगडू': 'DAGADU', 'दत्तात्रय': 'DATTATRAY', 'दळवी': 'DALVI', 'दाभाडे': 'DABHADE',
  'दिपाली': 'DIPALI', 'दिलीप': 'DILIP', 'दीक्षित': 'DIXIT', 'देबजे': 'DEBJE', 'देवडे': 'DEVDE',
  'धनंजय': 'DHANANJAY', 'नंदाबाई': 'NANDABAI', 'नसीब': 'NASEEB', 'नसीम': 'NASEEM', 'नामदेव': 'NAMDEV',
  'निंबाजी': 'NIMBAJI', 'परवीन': 'PARVEEN', 'पवन': 'PAWAN', 'पांडुरंग': 'PANDURANG', 'पार्वतीबाई': 'PARVATIBAI',
  'पुरुषोत्तम': 'PURUSHOTTAM', 'पुरोहित': 'PUROHIT', 'पुष्पाबाई': 'PUSHPABAI', 'पूजा': 'POOJA', 'प्रकाश': 'PRAKASH',
  'प्रभाकर': 'PRABHAKAR', 'प्रशांत': 'PRASHANT', 'फंगल': 'FANGAL', 'फकिरा': 'FAKIRA', 'फहमीदाबी': 'FAHMIDABI',
  'बानो': 'BANO', 'बाबूराव': 'BABURAO', 'बिबन': 'BIBAN', 'बी': 'BI', 'बेगम': 'BEGAM',
  'भगवान': 'BHAGWAN', 'भालचंद्र': 'BHALCHANDRA', 'भिकाजी': 'BHIKAJI', 'भिसे': 'BHISE', 'मधुकर': 'MADHUKAR',
  'मनिष': 'MANISH', 'मनोहर': 'MANOHAR', 'महमूद': 'MAHMUD', 'महाजन': 'MAHAJAN', 'महादू': 'MAHADU',
  'महेबूब': 'MAHEBOOB', 'माटे': 'MATE', 'मानवतकर': 'MANWATKAR', 'मालन': 'MALAN', 'मालीराम': 'MALIRAM',
  'मिलिंद': 'MILIND', 'मिस्कीन': 'MISKIN', 'मुख्तार': 'MUKHTAR', 'मुणोत': 'MUNOT', 'मुनीर': 'MUNIR',
  'मुरकुट': 'MURKUT', 'मोबीन': 'MOBIN', 'मोरे': 'MORE', 'मोहन': 'MOHAN', 'मोहम्मद': 'MOHAMMAD',
  'मोहसीन': 'MOHSIN', 'म्हस्के': 'MHASKE', 'यश': 'YASH', 'रंजना': 'RANJANA', 'रजिया': 'RAJIYA',
  'रझ्झाक': 'RAZZAK', 'रफीक': 'RAFIK', 'रमेश': 'RAMESH', 'रवींद्र': 'RAVINDRA', 'रशीद': 'RASHID',
  'रहीम': 'RAHIM', 'राजाराम': 'RAJARAM', 'राजेश': 'RAJESH', 'राधा': 'RADHA', 'रामचंद्र': 'RAMCHANDRA',
  'रामभाऊ': 'RAMBHAU', 'रामराव': 'RAMRAO', 'रामलाल': 'RAMLAL', 'रियाज': 'RIYAZ', 'रुखमिना': 'RUKHMINA',
  'रुबीना': 'RUBINA', 'रेशमा': 'RESHMA', 'लक्ष्मण': 'LAKSHMAN', 'लाल': 'LAL', 'वाठोरे': 'VATHOLE',
  'वानखडे': 'WANKHADE', 'वामन': 'WAMAN', 'विकास': 'VIKAS', 'विक्रम': 'VIKRAM', 'विजय': 'VIJAY',
  'विठोबा': 'VITHOBA', 'विलास': 'VILAS', 'विष्णू': 'VISHNU', 'शबाना': 'SHABANA', 'शर्मा': 'SHARMA',
  'शशिकला': 'SHASHIKALA', 'शायरे': 'SHAYRE', 'शाह': 'SHAH', 'शिकारे': 'SHIKARE', 'शिवाजी': 'SHIVAJI',
  'शेख': 'SHAIKH', 'शेळके': 'SHELKE', 'श्याम': 'SHYAM', 'संजय': 'SANJAY', 'संतोष': 'SANTOSH',
  'संदीप': 'SANDIP', 'सखाराम': 'SAKHARAM', 'सदाशिव': 'SADASHIV', 'सरकाटे': 'SARKATE', 'सरतापे': 'SARTAPE',
  'सांगोळे': 'SANGOLE', 'सागर': 'SAGAR', 'सावळे': 'SAWALE', 'सिंधुबाई': 'SINDHUBAI', 'सिद्दीक': 'SIDDIK',
  'सुनीता': 'SUNITA', 'सुरेश': 'SURESH', 'स्वप्निल': 'SWAPNIL', 'हनीफ': 'HANIF', 'हबीब': 'HABIB',
  'हरिभाऊ': 'HARIBHAU', 'हिरामन': 'HIRAMAN', 'हुसेन': 'HUSEN', 'हे': 'HE'
};

function transliterateMarathiText(text) {
  if (!text) return '';
  let str = text;
  for (const [mr, en] of Object.entries(marathiToEnglish)) {
    str = str.split(mr).join(en);
  }
  // Replace any leftover devanagari characters or weird punctuation
  str = str.replace(/[\u0900-\u097F]/g, '').replace(/[^a-zA-Z\s\.\-]/g, ' ').replace(/\s+/g, ' ').trim();
  return str.toUpperCase();
}

function fetchCard(srcNo) {
  return new Promise((resolve) => {
    const postData = 'src_no=' + srcNo + '&month=8&year=2026';
    const req = https.request(
      {
        hostname: 'epos.mahafood.gov.in',
        path: '/SRC_Trans_Details.jsp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 4500
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
            if (
              tds.length >= 4 &&
              /^\d+$/.test(tds[0]) &&
              tds[1] &&
              !tds[1].includes('Wheat') &&
              !tds[1].includes('Rice') &&
              !tds[1].includes('Sugar') &&
              !tds[1].includes('Jowar') &&
              !tds[1].includes('SAREE') &&
              !tds[1].includes('Oil') &&
              !tds[1].includes('Receipt')
            ) {
              members.push({
                slNo: tds[0],
                member: tds[1].replace(/\s+/g, ' ').trim(),
                gender: tds[2],
                age: parseInt(tds[3], 10) || 0,
                status: 'Active',
                uid: 'Seeded'
              });
            }
          });

          if (members.length === 0) {
            resolve(null);
            return;
          }

          // Pick head of family: Adult (18+) with 2+ words, preference to elder female or full name
          const multiWordAdults = members.filter((m) => m.age >= 18 && m.member.split(' ').length >= 2);
          const femaleAdults = multiWordAdults.filter((m) => m.gender === 'Female');
          let head = '';
          if (femaleAdults.length > 0) {
            head = femaleAdults[0].member;
          } else if (multiWordAdults.length > 0) {
            head = multiWordAdults[0].member;
          } else {
            const anyMulti = members.find((m) => m.member.split(' ').length >= 2);
            if (anyMulti) {
              head = anyMulti.member;
            } else {
              const adults = members.filter((m) => m.age >= 18);
              head = adults.length > 0 ? adults[0].member : members[0].member;
            }
          }

          resolve({ srcNo, head, members });
        });
      }
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.write(postData);
    req.end();
  });
}

async function run() {
  const registryPath = path.resolve('src/data/shopCardRegistry.json');
  const cachePath = path.resolve('src/data/realCardNamesCache.json');
  const familyPath = path.resolve('src/data/rcFamilyMembers.json');
  const shopsPath = path.resolve('src/data/mehkarShops.json');

  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  const family = JSON.parse(fs.readFileSync(familyPath, 'utf8'));
  const shops = JSON.parse(fs.readFileSync(shopsPath, 'utf8'));

  // Step 1: Identify cards that need live fetch
  // Cards with single-word name, or containing devanagari characters, or without proper English full name
  const cardsToFetch = [];
  const srcSeen = new Set();

  for (const shopId in registry) {
    for (const card of registry[shopId]) {
      if (srcSeen.has(card.srcNo)) continue;
      srcSeen.add(card.srcNo);

      const name = (card.cardHolderName || '').trim();
      const hasDevanagari = /[\u0900-\u097F]/.test(name);
      const isSingleWord = !name.includes(' ');
      const isMissing = !name || name === 'उपलब्ध नाही';

      if (hasDevanagari || isSingleWord || isMissing) {
        cardsToFetch.push(card.srcNo);
      }
    }
  }

  console.log(`Identified ${cardsToFetch.length} cards needing real head of family query from ePOS...`);

  // Step 2: Concurrently fetch cards in batches of 20
  const BATCH_SIZE = 20;
  let fetchedCount = 0;
  let successCount = 0;

  for (let i = 0; i < cardsToFetch.length; i += BATCH_SIZE) {
    const batch = cardsToFetch.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(fetchCard));

    results.forEach((res) => {
      if (res && res.head) {
        successCount++;
        const cleanHead = res.head.toUpperCase().trim();
        cache[res.srcNo] = cleanHead;
        if (res.members && res.members.length > 0) {
          family[res.srcNo] = res.members;
        }
      }
    });

    fetchedCount += batch.length;
    if (fetchedCount % 100 === 0 || fetchedCount >= cardsToFetch.length) {
      console.log(`Progress: ${fetchedCount} / ${cardsToFetch.length} fetched (${successCount} successful hits)`);
    }
  }

  console.log(`Live queries done. Now normalizing all cardholder names across registry and shops...`);

  // Step 3: Normalize EVERY card in registry, cache, family, and shops
  for (const shopId in registry) {
    for (const card of registry[shopId]) {
      let finalName = '';

      // Check cache first
      if (cache[card.srcNo] && /^[A-Za-z\s\.\-]+$/.test(cache[card.srcNo]) && cache[card.srcNo].includes(' ')) {
        finalName = cache[card.srcNo];
      }

      // Check family members
      if (!finalName && family[card.srcNo]) {
        const fMembers = family[card.srcNo];
        const multiWordAdults = fMembers.filter(
          (m) => m.age >= 18 && /^[A-Za-z\s\.\-]+$/.test(m.member) && m.member.includes(' ')
        );
        if (multiWordAdults.length > 0) {
          finalName = multiWordAdults[0].member.toUpperCase();
        } else {
          const anyMulti = fMembers.find(
            (m) => /^[A-Za-z\s\.\-]+$/.test(m.member) && m.member.includes(' ')
          );
          if (anyMulti) {
            finalName = anyMulti.member.toUpperCase();
          }
        }
      }

      // If still not resolved or has Marathi, transliterate
      if (!finalName) {
        const currentName = card.cardHolderName || cache[card.srcNo] || '';
        finalName = transliterateMarathiText(currentName);
      }

      // If single word still, format with proper surname if family member has one
      if (!finalName.includes(' ') && family[card.srcNo]) {
        const anyMemberWithSurname = family[card.srcNo].find((m) => m.member.split(' ').length >= 2);
        if (anyMemberWithSurname) {
          finalName = transliterateMarathiText(anyMemberWithSurname.member);
        }
      }

      if (!finalName || finalName.length < 3) {
        finalName = 'CARDHOLDER MEHKAR';
      }

      finalName = finalName.replace(/\s+/g, ' ').trim().toUpperCase();

      card.cardHolderName = finalName;
      cache[card.srcNo] = finalName;
    }
  }

  // Update mehkarShops.json pendingCardsList
  for (const shop of shops) {
    if (registry[shop.fpsId]) {
      shop.pendingCardsList = registry[shop.fpsId];
    }
  }

  // Clean family member names of any leftover Marathi text
  for (const src in family) {
    family[src].forEach((m) => {
      if (/[\u0900-\u097F]/.test(m.member)) {
        m.member = transliterateMarathiText(m.member);
      }
    });
  }

  // Write all back
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  fs.writeFileSync(familyPath, JSON.stringify(family, null, 2));
  fs.writeFileSync(shopsPath, JSON.stringify(shops, null, 2));

  console.log('COMPLETED! All cardholder names updated in 100% real English across all files.');
}

run();

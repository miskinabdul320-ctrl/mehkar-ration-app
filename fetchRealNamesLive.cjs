const https = require('https');
const fs = require('fs');
const path = require('path');

const nonAvailedPath = path.resolve('src/data/realEposNonAvailedCards.json');
const registryPath = path.resolve('src/data/shopCardRegistry.json');
const cachePath = path.resolve('src/data/realCardNamesCache.json');

const nonAvailed = JSON.parse(fs.readFileSync(nonAvailedPath, 'utf-8'));
let registry = fs.existsSync(registryPath) ? JSON.parse(fs.readFileSync(registryPath, 'utf-8')) : {};
let nameCache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf-8')) : {};

const agent = new https.Agent({ keepAlive: true, maxSockets: 25, timeout: 6000 });

// Comprehensive Devanagari transliteration map for authentic Mehkar names
const transMap = {
  PRASHANT: 'प्रशांत', DATTATRAY: 'दत्तात्रय', DATTATRAYA: 'दत्तात्रय', TATHE: 'ताठे',
  SWAPNIL: 'स्वप्निल', MADHUKAR: 'मधुकर', SARKATE: 'सरकाटे',
  DHANANJAY: 'धनंजय', TEKALE: 'टेकाळे',
  DEVDE: 'देवडे', KAILAS: 'कैलास', SAKHARAM: 'सखाराम',
  KISHOR: 'किशोर', JANU: 'जानू', MORE: 'मोरे',
  PRAKASH: 'प्रकाश', RAJARAM: 'राजाराम', DABHADE: 'दाभाडे',
  CHAND: 'चांद', MAHEBOOB: 'महेबूब', SHEKH: 'शेख', SHAIKH: 'शेख', SHE: 'शेख',
  GOKARNABAI: 'गोकर्णाबाई', PANDURANG: 'पांडुरंग',
  BHISE: 'भिसे', SAGAR: 'सागर', PRABHAKAR: 'प्रभाकर',
  AVARE: 'आवारे', KALPANA: 'कल्पना', MILIND: 'मिलिंद',
  ASAMA: 'असमा', JABIN: 'जबीन', ABDUL: 'अब्दुल', SIDDIK: 'सिद्दीक',
  GOVEKAR: 'गोवेकर', RAMLAL: 'रामलाल', PYARELAL: 'प्यारेलाल',
  ARATI: 'आरती', DILIPSING: 'दिलीपसिंग', MUNOT: 'मुणोत',
  UKALKAR: 'उकळकर', BHALCHANDRA: 'भालचंद्र',
  KARIM: 'करीम', LAL: 'लाल',
  KHARATE: 'खराते', SANDIP: 'संदीप', WAMAN: 'वामन',
  SHABANA: 'शबाना', GUDDHE: 'गुद्धे', RAMCHANDRA: 'रामचंद्र', SADASHIV: 'सदाशिव',
  AANAND: 'आनंद', UDDHAO: 'उद्धव', FANGAL: 'फंगल',
  DNYANBA: 'ज्ञानबा', DHAGE: 'ढगे',
  ALTAB: 'अल्ताफ', SHAH: 'शाह', MEHMUD: 'महमूद',
  MOHSIN: 'मोहसीन', KHAN: 'खान', KARAMAT: 'करामत',
  ANITA: 'अनिता', GIRDHARI: 'गिरधारी', PUROHIT: 'पुरोहित',
  KULDIPKAUR: 'कुलदीप कौर', JUGANSING: 'जुगनसिंग', BAVARI: 'बावरी',
  HAJUMA: 'हजुमा', BANO: 'बानो', RAZZAK: 'रझ्झाक', KACHHI: 'कच्छी',
  MUDASIR: 'मुदस्सीर', RAFIK: 'रफीक',
  AASHIKA: 'आशिका', SHYAM: 'श्याम', FALODE: 'फालोडे',
  RADHA: 'राधा', GIRHE: 'गिर्‍हे', HARIBHAU: 'हरिभाऊ', VITHOBA: 'विठोबा',
  INGALE: 'इंगळे', RAJESH: 'राजेश', JAIBAI: 'जयबाई', RAJIYA: 'रजिया',
  MOBIN: 'मोबीन', FASAM: 'फसम', ASAD: 'असद', ASLAM: 'अस्लम',
  JYOTI: 'ज्योती', GADEKAR: 'गाडेकर', LAHUDKARYAMUNABAI: 'लहुडकर यमुनाबाई',
  KISAN: 'किसन', CHAUDHARI: 'चौधरी', JAMANBAI: 'जमनबाई', TUKADYA: 'तुकड्या',
  JOHORABEGAM: 'जोहराबेगम', MUNIR: 'मुनीर',
  ABEDABI: 'आबेदाबी', WANKHEDE: 'वानखडे', ANIL: 'अनिल', SURESH: 'सुरेश',
  KANIZA: 'कनिजा', BEGAM: 'बेगम', ZIYA: 'झिया', UL: 'उल', HAK: 'हक',
  INSHIRA: 'इनशिरा', JAVED: 'जावेद',
  ANNAPURNA: 'अन्नपूर्णा', MAHADU: 'महादू', MATE: 'माटे',
  ABHISHEK: 'अभिषेक', PREMKUMAR: 'प्रेमकुमार', SAWALE: 'सावळे',
  DOSTA: 'दोस्त', MOHMMAD: 'मोहम्मद', HUSEN: 'हुसेन',
  DIPALI: 'दिपाली', VILAS: 'विलास', HIVARKAR: 'हिवरकर',
  AARYA: 'आर्या', PAWAN: 'पवन', DIXIT: 'दीक्षित',
  NAJEARA: 'नजीराबी', BI: 'बी', RAHIM: 'रहीम',
  MURKUT: 'मुरकुट', USHA: 'उषा', NAMDEV: 'नामदेव',
  CHAVHAN: 'चव्हाण', VIKRAM: 'विक्रम', RAMBHAU: 'रामभाऊ',
  JOSHI: 'जोशी', ASHOK: 'अशोक', SHELKE: 'शेळके', RANJANA: 'रंजना',
  AFJR: 'अफसर', JAFR: 'जाफर',
  REISABIASLM: 'रईसाबी अस्लम', DALAVI: 'दळवी', LAKSHMAN: 'लक्ष्मण',
  BASHIRE: 'बाशिरे', NANDABAI: 'नंदाबाई',
  SHARMA: 'शर्मा', KAVITA: 'कविता', GANESH: 'गणेश',
  GOPAL: 'गोपाल', MALIRAM: 'मालीराम',
  SANJAY: 'संजय', KHANDARKAR: 'खंदरकर',
  SARTAPE: 'सरतापे', NIMBAJI: 'निंबाजी', DAGADU: 'दगडू',
  BAVANE: 'बावणे',
  AYAZ: 'अयाज', AHMAD: 'अहमद', AHEMAD: 'अहमद', HABIB: 'हबीब', KHATIK: 'खाटिक',
  ILYAS: 'इल्यास', ELIYAZ: 'इल्यास', NASIM: 'नसीम', PARWIN: 'परवीन', PARVEEN: 'परवीन',
  NORJAHA: 'नूरजहाँ', RIYAZ: 'रियाज', RESHMA: 'रेशमा', ASIYABEE: 'आशियाबी',
  ASIF: 'आसिफ', QURESHI: 'कुरेशी', KURESHI: 'कुरेशी', HUJEFA: 'हुजैफा',
  NASIB: 'नसीब', HANIF: 'हनीफ', MOHAMMAD: 'मोहम्मद', RUBINA: 'रुबीना',
  TAJUNBI: 'ताजुंबी', ARSHAN: 'अर्शान', PARVATIBAI: 'पार्वतीबाई', VATHORE: 'वाठोरे',
  MALAN: 'मालन', KADAR: 'कादर', PUSHPABAI: 'पुष्पाबाई', MANOHAR: 'मनोहर', SHIKARE: 'शिकारे',
  TASLIM: 'तस्लीम', ANIS: 'अनीस', FAKIRA: 'फकिरा', BIBAN: 'बिबन', PHEMIDABI: 'फहमीदाबी',
  RASHID: 'रशीद', MUKTHAR: 'मुख्तार', JISHAN: 'झीशान', DILIP: 'दिलीप',
  GAVATE: 'गव्हाते', SHASHIKALA: 'शशिकला', KASHIRAM: 'काशीराम',
  KHOTE: 'खोटे', RUKHMINA: 'रुखमिना', SINDHUBAI: 'सिंधुबाई', PURUSHOTTAM: 'पुरुषोत्तम',
  MANWATKAR: 'मानवतकर', JAMILA: 'जमीला', AKSHARA: 'अक्षरा', ANNANYA: 'अनन्या',
  ARCHANA: 'अर्चना', GJANAN: 'गजानन', GAJANAN: 'गजानन', JAYASHRI: 'जयश्री',
  MAMTA: 'ममता', POOJA: 'पूजा', RAVINDRA: 'रवींद्र', VIJAY: 'विजय', VIKAS: 'विकास', YASH: 'यश',
  BHAGAVAN: 'भगवान', KUKAJI: 'कुकाजी', MISAL: 'मिसाळ', MISKIN: 'मिस्कीन',
  SUNITA: 'सुनीता', RAMESH: 'रमेश', BHIKAJI: 'भिकाजी', SHIRE: 'शायरे',
  VISHNU: 'विष्णू', HIRAMAN: 'हिरामन', MOHAN: 'मोहन', TRYAMBAK: 'त्र्यंबक', UMALKAR: 'उमाळकर',
  KAILASH: 'कैलास', KISNRAO: 'किसनराव', DEBAJE: 'देबजे', MANISH: 'मनिष',
  KHALIL: 'खलील', CHETAN: 'चेतन', MAHAJAN: 'महाजन', RAMRAO: 'रामराव', BABURAO: 'बाबूराव', MHASKE: 'म्हस्के',
  IBRAHIM: 'इब्राहिम', OMPRAKASH: 'ओमप्रकाश', CHOGALAL: 'छोगालाल', SANTOSH: 'संतोष', SHIVAJI: 'शिवाजी', SANGOLE: 'सांगोळे'
};

function transliterateToMarathi(englishName) {
  if (!englishName) return '';
  const clean = englishName.replace(/[^a-zA-Z\s]/g, ' ').trim();
  const parts = clean.toUpperCase().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return englishName;

  const marathiParts = parts.map(p => transMap[p] || p);
  // If some parts were translated, join them
  const hasMarathi = marathiParts.some(p => /[\u0900-\u097F]/.test(p));
  if (hasMarathi) {
    return marathiParts.join(' ');
  }
  return englishName;
}

function fetchCardHead(srcNo) {
  return new Promise((resolve) => {
    if (nameCache[srcNo]) {
      return resolve(nameCache[srcNo]);
    }

    const postData = `src_no=${srcNo}&month=9&year=2026`;
    const req = https.request(
      {
        hostname: 'epos.mahafood.gov.in',
        path: '/SRC_Trans_Details.jsp',
        method: 'POST',
        agent,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'Mozilla/5.0'
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
            if (tds.length >= 4 && /^\d+$/.test(tds[0]) && tds[1]) {
              members.push({ name: tds[1], gender: tds[2], age: parseInt(tds[3], 10) || 0 });
            }
          });

          if (members.length > 0) {
            // Sort by age descending to find the adult head of family
            const sorted = [...members].sort((a, b) => b.age - a.age);
            const head = sorted[0].name.trim();
            const marathiName = transliterateToMarathi(head);
            const chosen = marathiName || head;
            nameCache[srcNo] = chosen;
            resolve(chosen);
          } else {
            resolve('');
          }
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
  console.log('Starting Live ePOS cardholder name fetching for Mehkar ration cards...');
  const shopIds = Object.keys(nonAvailed);

  // 1. Process all shops
  for (const fpsId of shopIds) {
    console.log(`Processing FPS ${fpsId}... (Total cards: ${nonAvailed[fpsId].length})`);
    const cards = nonAvailed[fpsId];
    
    // Fetch names in batches of 20 concurrent
    const updatedCards = await mapConcurrent(cards, 20, async (c, idx) => {
      let cardHolderName = nameCache[c.srcNo];
      if (!cardHolderName) {
        cardHolderName = await fetchCardHead(c.srcNo);
      }
      return {
        srNo: idx + 1,
        srcNo: c.srcNo,
        scheme: c.scheme,
        units: c.units,
        cardHolderName: cardHolderName || `शिधापत्रिका धारक (SRC: ${c.srcNo.slice(-4)})`
      };
    });

    registry[fpsId] = updatedCards;
    // Save incrementally
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
    fs.writeFileSync(cachePath, JSON.stringify(nameCache, null, 2));
    console.log(`Saved ${updatedCards.length} cards for FPS ${fpsId}.`);
  }

  console.log('Done! All shops updated with real names in shopCardRegistry.json');
}

run();

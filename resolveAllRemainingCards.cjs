const https = require('https');
const fs = require('fs');

const shops = JSON.parse(fs.readFileSync('src/data/mehkarShops.json', 'utf-8'));

function fetchCard(srcNo, month) {
  return new Promise((resolve) => {
    const postData = `src_no=${srcNo}&month=${month}&year=2026`;
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
          if (members.length > 0) {
            const full = members.find((m) => m.name.split(' ').length >= 2);
            resolve(full ? full.name : members[0].name);
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

// Convert English name to clean, elegant Marathi name
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
  BAVANE: 'बावणे'
};

function formatCleanMarathiName(raw) {
  if (!raw || raw.startsWith('कार्डधारक')) return raw;
  // Clean string
  const cleanStr = raw.replace(/\(.*?\)/g, '').replace(/[^a-zA-Z\s\u0900-\u097F]/g, ' ').trim();
  const words = cleanStr.toUpperCase().split(/\s+/).filter(Boolean);
  const marathiWords = words.map((w) => transMap[w] || w);
  return marathiWords.join(' ');
}

async function run() {
  for (const shop of shops) {
    console.log(`Processing shop ${shop.fpsId}...`);
    for (const card of shop.pendingCardsList) {
      if (!card.cardHolderName || card.cardHolderName.startsWith('कार्डधारक')) {
        let name = await fetchCard(card.srcNo, 9);
        if (!name) name = await fetchCard(card.srcNo, 8);
        if (name) {
          card.cardHolderName = formatCleanMarathiName(name);
          console.log(`  Found name for ${card.srcNo}: ${card.cardHolderName}`);
        }
      } else {
        // Clean existing name so it doesn't have ugly redundant parentheses
        card.cardHolderName = formatCleanMarathiName(card.cardHolderName);
      }
    }
  }

  fs.writeFileSync('src/data/mehkarShops.json', JSON.stringify(shops, null, 2));
  console.log('Finished updating all cardholder names cleanly in mehkarShops.json!');
}

run();

const https = require('https');
const fs = require('fs');

const postData = 'month=9&year=2026&dist_code=1500&afso_code=1500246&afso_name=MEHKAR';

const req = https.request(
  {
    hostname: 'epos.mahafood.gov.in',
    path: '/Non_Avail_Abst_fps.jsp',
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
      console.log('Status:', res.statusCode, 'Length:', data.length);
      fs.writeFileSync('/tmp/non_avail_fps.html', data);
      const targets = [
        '150024600318',
        '150024600319',
        '150024600320',
        '150024600322',
        '150024600323',
        '150024600324',
        '150024600325',
        '150024600326',
        '150024600327',
        '150024600328',
        '150024600329',
        '150024600330',
        '150024600331',
        '150024600359'
      ];
      const rows = data.split('<tr');
      rows.forEach((r) => {
        targets.forEach((t) => {
          if (r.includes(t)) {
            const cells = r
              .split('</td>')
              .map((c) => c.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
            console.log('MATCH FPS ' + t + ' => ' + JSON.stringify(cells));
          }
        });
      });
    });
  }
);

req.on('error', (e) => console.error(e));
req.write(postData);
req.end();

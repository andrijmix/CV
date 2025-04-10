function getBase64ImageFromURL(url, callback) {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = function () {
    const canvas = document.createElement('canvas');
    canvas.width = this.naturalWidth;
    canvas.height = this.naturalHeight;
    canvas.getContext('2d').drawImage(this, 0, 0);
    const dataURL = canvas.toDataURL('image/jpeg');
    callback(dataURL);
  };
  img.src = url;
}

function getQRCodeImage(url, callback) {
  const api = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(url)}`;
  getBase64ImageFromURL(api, callback);
}

function extractListTextFromElement(element) {
  if (!element) return [];
  const items = element.querySelectorAll('div.job, div.project, div.education, div.language, li, div.tag');
  return Array.from(items).map(el => {
    const text = el.innerText.trim();
    return text.replace("📅", "").replace("📍", "");
  }).filter(Boolean);
}

function getLangSuffix() {
  const lang = document.documentElement.lang || 'en';
  return lang === 'uk' ? '_ua' : '_en';
}

function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size)
    result.push(array.slice(i, i + size));
  return result;
}

function generatePDF(openInNewTab = false) {
  document.querySelectorAll('details').forEach(d => d.open = true);

  getBase64ImageFromURL('photo.jpg', function(photoData) {
    getQRCodeImage(window.location.href, function(qrCodeData) {
      const name = document.querySelector('header h1')?.innerText || 'Andrii Mikhnevych';
      const title = document.querySelector('header p:nth-of-type(2)')?.innerText || '';
      const summary = document.querySelector('header p:nth-of-type(3)')?.innerText || '';
      const contact = document.querySelector('header p:nth-of-type(4)')?.innerText || '';

      const details = document.querySelectorAll('section details');
      const experience = extractListTextFromElement(details[0]);
      const projects = extractListTextFromElement(details[1]);
      const skills = extractListTextFromElement(details[2]);
      const education = extractListTextFromElement(details[3]);
      const languages = extractListTextFromElement(details[4]);
      const hobbies = extractListTextFromElement(details[5]);

      const skillRows = chunkArray(skills, 5).map(row => ({
        columns: row.map(skill => ({ text: skill, style: 'tag' })),
        columnGap: 4,
        margin: [0, 0, 0, 2]
      }));

      const docDefinition = {
        pageMargins: [36, 36, 36, 60],
        content: [
          {
            columns: [
              { image: photoData, width: 80, margin: [0, 0, 20, 0] },
              {
                width: '*',
                stack: [
                  { text: name, style: 'name' },
                  { text: title, style: 'role' },
                  { text: contact, style: 'contact', link: 'mailto:andrijmix@gmail.com' },
                  { text: summary, style: 'summary' }
                ]
              },
              { image: qrCodeData, width: 60, alignment: 'right' }
            ],
            margin: [0, 0, 0, 10]
          },
          {
            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 0.5, color: '#ccc' }],
            margin: [0, 0, 0, 12]
          },
          {
            columns: [
              {
                width: '48%',
                stack: [
                  { text: details[0]?.querySelector('summary h2')?.innerText || 'Experience', style: 'sectionLeft' },
                  ...experience.map(text => ({ text, style: 'entry' })),
                  { text: details[3]?.querySelector('summary h2')?.innerText || 'Education', style: 'sectionLeft' },
                  ...education.map(text => ({ text, style: 'entry' }))
                ]
              },
              {
                width: 1,
                canvas: [{ type: 'line', x1: 0, y1: 0, x2: 0, y2: 600, lineWidth: 0.5, color: '#ccc' }]
              },
              {
                width: '48%',
                stack: [
                  { text: details[1]?.querySelector('summary h2')?.innerText || 'Projects', style: 'sectionRight' },
                  ...projects.map(text => ({ text, style: 'entry' })),
                  { text: details[2]?.querySelector('summary h2')?.innerText || 'Skills', style: 'sectionRight' },
                  ...skillRows,
                  { text: details[4]?.querySelector('summary h2')?.innerText || 'Languages', style: 'sectionRight' },
                  ...languages.map(text => ({ text, style: 'entry' })),
                  { text: details[5]?.querySelector('summary h2')?.innerText || 'Hobbies', style: 'sectionRight' },
                  ...hobbies.map(text => ({ text, style: 'entry' }))
                ]
              }
            ],
            columnGap: 10,
            margin: [0, 0, 0, 12]
          },        ],
        styles: {
          name: { fontSize: 16, bold: true, margin: [0, 0, 0, 4] },
          role: { fontSize: 10, italics: true, color: '#555', margin: [0, 0, 0, 2] },
          contact: { fontSize: 9, color: '#007acc', margin: [0, 0, 0, 4] },
          summary: { fontSize: 8.5, margin: [0, 4, 0, 10], color: '#444' },
          sectionLeft: { fontSize: 11, bold: true, color: '#1e40af', margin: [0, 12, 0, 6] },
          sectionRight: { fontSize: 11, bold: true, color: '#2563eb', margin: [0, 12, 0, 6] },
          entry: { fontSize: 8.3, margin: [0, 0, 0, 2] },
          tag: {
            fontSize: 7.8,
            color: '#1f2937',
            bold: true,
            fillColor: '#dbeafe',
            alignment: 'center',
            margin: [0, 2, 2, 2],
            lineHeight: 1.1
          }
        }
      };

      const fileName = `Andrii_Mikhnevych_CV${getLangSuffix()}.pdf`;
      const pdfDoc = pdfMake.createPdf(docDefinition);
      if (openInNewTab) {
        pdfDoc.open();
      } else {
        pdfDoc.download(fileName);
      }
    });
  });
}

function generatePDF() {
    const element = document.getElementById('content');
    const header = document.querySelector('header');
  
    // Клонуємо контент і додаємо шапку
    const clone = document.createElement('div');
    clone.style.maxWidth = '800px';
    clone.style.margin = 'auto';
    clone.appendChild(header.cloneNode(true));
    clone.appendChild(element.cloneNode(true));
  
    // Відкриваємо всі details для повного рендеру
    const closed = [];
    clone.querySelectorAll('details').forEach(d => {
      if (!d.open) {
        d.open = true;
        closed.push(d);
      }
    });
  
    // Встановлюємо світлу тему
    const originalTheme = document.body.classList.contains('dark');
    if (originalTheme) document.body.classList.remove('dark');
  
    // Додаємо стилі для уникнення розриву блоків
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      details, .job, .project, .education {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    `;
    clone.appendChild(style);
  
    // Показуємо тільки для генерації
    document.body.appendChild(clone);
  
    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     'andrii_mikhnevych_cv.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
  
    html2pdf().set(opt).from(clone).save().then(() => {
      // Повертаємо темну тему
      if (originalTheme) document.body.classList.add('dark');
      clone.remove();
    });
  }
  
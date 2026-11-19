function getBase64ImageFromURL(url, callback) {
  // Use fetch + FileReader — works for both local files and remote URLs
  // without triggering canvas CORS taint issues.
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.blob();
    })
    .then(blob => {
      const reader = new FileReader();
      reader.onloadend = function () {
        const dataURL = reader.result;
        // Determine image ratio via a temporary Image element.
        const img = new Image();
        img.onload = function () {
          const ratio = this.naturalWidth / (this.naturalHeight || 1);
          callback(dataURL, ratio);
        };
        img.onerror = function () { callback(dataURL, 1); };
        img.src = dataURL;
      };
      reader.onerror = function () { callback('', 1); };
      reader.readAsDataURL(blob);
    })
    .catch(err => {
      console.warn('getBase64ImageFromURL fetch failed, skipping image:', url, err);
      callback('', 1);
    });
}

function getQRCodeImage(url, callback) {
  // External QR image requests can fail in restrictive networks/CORS environments.
  // Keep PDF generation reliable by gracefully skipping QR image.
  callback('', 1);
}

function getLangSuffix() {
  const lang = document.documentElement.lang || 'en';
  return lang === 'uk' ? '_ua' : '_en';
}

const JOB_BULLET_CAPS = [5, 3, 3, 5, 2, 2]; // PDF only: max bullets per job, newest first

function findSection(key) {
  return document.querySelector(`main section[data-pdf="${key}"]`);
}

function sectionTitle(section, fallback) {
  return section?.querySelector('h2')?.innerText || fallback;
}

function createCertificateEntries(detailsElement) {
  if (!detailsElement) return [];

  const certificateElements = detailsElement.querySelectorAll('.certificate');
  const certificateItems = [];

  certificateElements.forEach(cert => {
    const title = cert.querySelector('h3')?.innerText || '';
    const org = cert.querySelector('p')?.innerText || '';
    const year = cert.querySelector('span')?.innerText || '';

    certificateItems.push({
      text: [
        { text: title, bold: true },
        { text: ' · ' + (year || org), color: '#6b7280' }
      ],
      fontSize: 8,
      margin: [0, 0, 0, 3]
    });
  });

  return certificateItems;
}
// Create calendar icon (smaller)
function createCalendarIcon() {
  return {
    canvas: [
      // Calendar body
      {
        type: 'rect',
        x: 0, y: 0,
        w: 6, h: 6,
        r: 1,
        color: '#808080'
      },
      // Calendar header
      {
        type: 'rect',
        x: 0, y: 0,
        w: 6, h: 1.5,
        color: '#3b82f6'
      }
    ],
    width: 6,
    height: 6
  };
}

// Create location pin icon (smaller)
function createLocationIcon() {
  return {
    canvas: [
      // Pin top (circle)
      {
        type: 'ellipse',
        x: 3, y: 1.5,
        r1: 1.5, r2: 1.5,
        color: '#3b82f6'
      },
      // Pin bottom (triangle)
      {
        type: 'polyline',
        points: [{x: 1.5, y: 2}, {x: 3, y: 6}, {x: 4.5, y: 2}],
        color: '#3b82f6',
        closePath: true,
        fillOpacity: 1
      }
    ],
    width: 6,
    height: 6
  };
}

// Create job entries with proper icons - more compact
function createJobEntries(detailsElement) {
  if (!detailsElement) return [];
  
  const jobElements = detailsElement.querySelectorAll('.job');
  const jobs = [];
  
  jobElements.forEach((job, jobIndex) => {
    const title = job.querySelector('.title')?.innerText;
    const company = job.querySelector('.company')?.innerText;

    // "📅 06/2025 – 03/2026   📍 Ukraine" -> date + location
    const dateLocation = job.querySelector('.meta')?.innerText || '';
    let datePart = '';
    let locationPart = '';
    if (dateLocation) {
      const parts = dateLocation.replace('📅', '').split('📍').map(s => s.trim());
      datePart = parts[0] || '';
      locationPart = parts[1] || '';
    }

    const tech = job.querySelector('.tech')?.innerText;
    let listItems = Array.from(job.querySelectorAll('li')).map(li => li.innerText);
    const cap = JOB_BULLET_CAPS[jobIndex];
    if (cap && !job.classList.contains('earlier')) listItems = listItems.slice(0, cap);

    const stack = [{ text: title || '', bold: true, fontSize: 12, margin: [0, 0, 0, 2] }];
    if (company) stack.push({ text: company, italics: true, fontSize: 10, margin: [0, 0, 0, 2] });
    if (datePart) {
      const metaCols = [
        {
          columns: [createCalendarIcon(), { text: datePart, fontSize: 9, margin: [2, 0, 0, 0] }],
          columnGap: 2,
          width: 'auto'
        }
      ];
      if (locationPart) {
        metaCols.push({
          columns: [createLocationIcon(), { text: locationPart, fontSize: 9, margin: [2, 0, 0, 0] }],
          columnGap: 2,
          width: 'auto'
        });
      }
      stack.push({ columns: metaCols, columnGap: 12, margin: [0, 0, 0, 2] });
    }
    stack.push({
      ul: listItems.map(item => ({ text: item, fontSize: 8.5 })),
      margin: [0, 2, 0, 2]
    });
    // (job technologies are omitted in the PDF: the Stack section covers them)

    const jobCard = { stack, margin: [0, 0, 0, 4] };
    
    jobs.push(jobCard);
  });

  return jobs;
}
// Create more compact project entries
function createProjectEntries(detailsElement) {
  if (!detailsElement) return [];
  
  const projectElements = detailsElement.querySelectorAll('.project');
  const projects = [];
  
  projectElements.forEach(project => {
    // The UnderTalk project is already covered by its Experience entry
    if (/UnderTalk/.test(project.querySelector('.title')?.innerText || '')) return;
    const title = project.querySelector('.title')?.innerText;
    const description = project.querySelector('.summary')?.innerText;
    const tech = project.querySelector('.tech')?.innerText;
    const items = Array.from(project.querySelectorAll('li')).map(li => li.innerText).slice(1); // drop the 'Problem' bullet
    const stack = [{ text: title, style: 'jobTitle' }]; // intro omitted in the PDF to save space
    if (items.length) stack.push({ ul: items.map(t => ({ text: t, fontSize: 8 })), margin: [0, 0, 0, 2] });
    if (tech) stack.push({ text: tech, fontSize: 8, color: '#6b7280' });

    const projectCard = {
      stack,
      style: 'compactCard',
      margin: [0, 0, 0, 4]
    };
    
    projects.push(projectCard);
  });
  
  return projects;
}

// Create more compact education entries
function createEducationEntries(detailsElement) {
  if (!detailsElement) return [];
  
  const educationElements = detailsElement.querySelectorAll('.education');
  const educationItems = [];
  
  educationElements.forEach(education => {
    const title = education.querySelector('h3')?.innerText;
    const years = education.querySelector('span')?.innerText;
    
    // Create compact education card
    const educationCard = {
      stack: [
        {
          columns: [
            {
              text: title,
              style: 'jobTitle',
              width: '*'
            },
            {
              columns: [
                {
                  width: 'auto',
                  stack: [createCalendarIcon()],
                  margin: [0, 2, 2, 0]
                },
                {
                  width: 'auto',
                  text: years,
                  style: 'dateLocation',
                  margin: [0, 1, 0, 0]
                }
              ],
              width: 'auto'
            }
          ]
        }
      ],
      style: 'compactCard',
      margin: [0, 0, 0, 3]
    };
    
    educationItems.push(educationCard);
  });
  
  return educationItems;
}

// Compact skill groups
function extractSkillGroups(detailsElement) {
  if (!detailsElement) return [];
  
  const skillGroups = detailsElement.querySelectorAll('.skill-group');
  const result = [];
  
  skillGroups.forEach(group => {
    const groupTitle = group.querySelector('h4')?.innerText;
    
    if (groupTitle) {
      // Add group title
      result.push({
        text: groupTitle,
        style: 'skillGroupTitle',
        margin: [0, 6, 0, 3]
      });
      
      // Get all tags in this group
      const tags = Array.from(group.querySelectorAll('.tag')).map(tag => tag.innerText);
      
      // Create compact tag layout
      const tagLayout = {
        columns: tags.map(tag => ({
          text: tag,
          style: 'tag',
          width: 'auto',
          margin: [0, 0, 6, 3]
        })),
        columnGap: 5,
        margin: [0, 0, 0, 6]
      };
      
      result.push(tagLayout);
    }
  });

  // Fallback for paragraph-based technologies format.
  if (result.length === 0) {
    const paragraphs = Array.from(detailsElement.querySelectorAll('p'));
    paragraphs.forEach(paragraph => {
      const label = paragraph.querySelector('strong')?.innerText || '';
      const fullText = paragraph.innerText || '';

      if (fullText.trim()) {
        result.push({
          text: label ? fullText.replace(label, '').trim() ? `${label} ${fullText.replace(label, '').trim()}` : label : fullText,
          style: 'description',
          margin: [0, 0, 0, 4]
        });
      }
    });
  }
  
  return result;
}

// More compact language entries
function createLanguageEntries(detailsElement) {
  if (!detailsElement) return [];
  
  const languageElements = detailsElement.querySelectorAll('.language');
  const languageItems = [];
  
  languageElements.forEach(language => {
    const langName = language.querySelector('strong')?.innerText;
    const level = language.querySelector('span')?.innerText;
    
    // Count filled dots
    const filledDots = language.querySelectorAll('.dot.full').length;
    const totalDots = language.querySelectorAll('.dot').length || 5;
    
    // Create compact language entry
    const languageCard = {
      columns: [
        {
          stack: [
            { 
              columns: [
                { text: langName, style: 'languageName', width: 'auto' },
                { text: ` - ${level}`, style: 'languageLevel', width: 'auto' }
              ]
            }
          ],
          width: '*'
        },
        {
          stack: [
            {
              canvas: [
                // Draw smaller squares
                ...Array(totalDots).fill().map((_, i) => ({
                  type: 'rect',
                  x: i * 12,
                  y: 0,
                  w: 8,
                  h: 8,
                  r: 1,
                  color: i < filledDots ? '#3b82f6' : '#e5e7eb'
                }))
              ],
              width: 65,
              height: 10
            }
          ],
          width: 'auto',
          alignment: 'right'
        }
      ],
      style: 'compactLanguageRow',
      margin: [0, 0, 0, 4]
    };
    
    languageItems.push(languageCard);
  });
  
  return languageItems;
}

// Compact hobbies
function extractHobbies(detailsElement) {
  if (!detailsElement) return [];
  
  const listItems = [];
  detailsElement.querySelectorAll('li').forEach(li => {
    listItems.push(li.innerText);
  });
  
  if (listItems.length > 0) {
    // One compact line: hobbies are low priority and space is tight
    return [{ text: listItems.join(' · '), style: 'hobbyItem', margin: [0, 3, 0, 0] }];
  }

  return [];
}

// Get social media links from the page
function getSocialLinks() {
  const socialLinks = [];
  const socialContainer = document.querySelector('.social-links');
  
  if (socialContainer) {
    const links = socialContainer.querySelectorAll('a');
    links.forEach(link => {
      socialLinks.push({
        text: link.textContent,
        url: link.href
      });
    });
  }
  
  // Get social links from footer if any
  const footerLinks = document.querySelectorAll('footer a');
  footerLinks.forEach(link => {
    // Skip email link
    if (!link.href.includes('mailto:')) {
      // Check if this link is already added
      const exists = socialLinks.some(social => social.url === link.href);
      if (!exists) {
        socialLinks.push({
          text: link.textContent,
          url: link.href
        });
      }
    }
  });
  
  return socialLinks;
}

function generatePDF(openInNewTab = false) {
  // Get theme state
  const isDarkTheme = document.body.classList.contains('dark');

  getQRCodeImage(window.location.href, function(qrCodeData) {
      // Get document language
      const isUkrainian = document.documentElement.lang === 'uk';
      
      // Extract header information
      const name = document.querySelector('header .name')?.innerText || 'Andrii Mikhnevych';
      const title = document.querySelector('header .headline')?.innerText || 'AI Engineer';
      const summary = document.querySelector('header .hook')?.innerText || '';
      const contact = document.querySelector('header .contact')?.innerText || '';

      // Get social links
      const socialLinks = getSocialLinks();

      // Sections are located by data-pdf attribute
      const impactSection = findSection('impact');
      const skillsDetail = findSection('skills');
      const experienceDetail = findSection('experience');
      const projectsDetail = findSection('projects');
      const educationDetail = findSection('education');
      const languagesDetail = findSection('languages');
      const hobbiesDetail = findSection('interests');
      const certificatesDetail = findSection('certificates');

      // Impact strip as one line of metrics
      const impactText = impactSection
        ? Array.from(impactSection.querySelectorAll('.stat'))
            .map(s => {
              // Use the final value, not the (possibly mid-animation) displayed number
              const num = s.querySelector('.num');
              const value = num?.dataset.count ? num.dataset.count + (num.dataset.suffix || '') : (num?.innerText || '');
              return `${value} ${s.querySelector('.label')?.innerText || ''}`.trim();
            })
            .join('  ·  ')
        : '';

      // Get section titles
      const experienceTitle = sectionTitle(experienceDetail, isUkrainian ? 'Досвід' : 'Experience');
      const projectsTitle = sectionTitle(projectsDetail, isUkrainian ? 'Проєкти' : 'Projects');
      const skillsTitle = sectionTitle(skillsDetail, isUkrainian ? 'Стек' : 'Stack');
      const educationTitle = sectionTitle(educationDetail, isUkrainian ? 'Освіта' : 'Education');
      const languagesTitle = sectionTitle(languagesDetail, isUkrainian ? 'Мови' : 'Languages');
      const hobbiesTitle = sectionTitle(hobbiesDetail, isUkrainian ? 'Захоплення' : 'Interests');
      const certificatesTitle = sectionTitle(certificatesDetail, isUkrainian ? 'Сертифікати та курси' : 'Certificates and Courses');

      // Create content sections
      const jobEntries = createJobEntries(experienceDetail);
      const projectEntries = createProjectEntries(projectsDetail);
      const skillItems = extractSkillGroups(skillsDetail);
      const educationEntries = createEducationEntries(educationDetail);
      const languageEntries = createLanguageEntries(languagesDetail);
      const hobbyEntries = extractHobbies(hobbiesDetail);
      const certificateEntries = createCertificateEntries(certificatesDetail);

      // Set colors based on theme
      const themeColors = isDarkTheme ? {
        primary: '#3b82f6',
        secondary: '#1e40af',
        text: '#f9fafb',
        muted: '#cbd5e1',
        background: '#1f2937',
        cardBg: '#273549',
        border: '#3b4860',
        tagBg: '#1e40af',
        tagText: '#bfdbfe',
        dotEmpty: '#374151'
      } : {
        primary: '#3b82f6',
        secondary: '#1e3a8a',
        text: '#1f2937',
        muted: '#6b7280',
        background: '#ffffff',
        cardBg: '#f9fafb',
        border: '#e5e7eb',
        tagBg: '#e0f2fe',
        tagText: '#0369a1',
        dotEmpty: '#e5e7eb'
      };

      // Create clickable social links array
      const socialLinksArray = [];
      
let socialLinksTextArray = [];

if (socialLinks.length > 0) {
  socialLinksTextArray.push({
    text: socialLinks[0].text,
    link: socialLinks[0].url,
    color: themeColors.primary,
    fontSize: 9
  });
  
  for (let i = 1; i < socialLinks.length; i++) {
    socialLinksTextArray.push({
      text: ' | ',  
      color: themeColors.muted,
      fontSize: 9
    });
    
    socialLinksTextArray.push({
      text: socialLinks[i].text,
      link: socialLinks[i].url,
      color: themeColors.primary,
      fontSize: 9
    });
  }
}
      const qrColumn = qrCodeData
        ? {
            image: qrCodeData,
            width: 40,
            alignment: 'right',
            margin: [0, 0, 0, 0]
          }
        : {
            width: 40,
            text: '',
            alignment: 'right'
          };

      // ULTRA-COMPACT PDF LAYOUT WITHOUT EMPTY PAGES
      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [30, 15, 30, 30], // Reduced margins
        background: function() {
          return {
            canvas: [
              {
                type: 'rect',
                x: 0, y: 0,
                w: 595.28, h: 841.89,
                color: isDarkTheme ? '#111827' : '#ffffff'
              }
            ]
          };
        },
        content: [
          // Ultra-compact header
          {
            columns: [
              // Main information
              {
                stack: [
                  {
                    text: name,
                    fontSize: 16, // Reduced font size
                    bold: true,
                    color: themeColors.text
                  },
                  {
                    text: title,
                    fontSize: 12, // Reduced font size
                    color: themeColors.secondary,
                    margin: [0, 2, 0, 3] // Reduced margins
                  },
                  {
                    text: summary,
                    fontSize: 9, // Reduced font size
                    italics: true,
                    color: themeColors.muted
                  },
                  {
                    text: contact,
                    fontSize: 8, // Reduced font size
                    color: themeColors.primary,
                    link: 'mailto:andrijmix@gmail.com',
                    margin: [0, 4, 0, 4]
                  },
                  {
                    text: socialLinksTextArray,  // Используем массив с разными стилями в одном тексте
  margin: [0, 2, 0, 0]
                  }
                ],
                width: '*'
              },
              // QR code (reduced size)
              qrColumn
            ],
            margin: [0, 0, 0, 3] // Ultra-minimal margin after header
          },
          
          // Divider line - very thin
          {
            canvas: [{ 
              type: 'line', 
              x1: 0, y1: 0, 
              x2: 535, y2: 0, 
              lineWidth: 1, 
              color: themeColors.primary 
            }],
            margin: [0, 3, 0, 5] // Minimal margins
          },
          
          // MAIN RESUME CONTENT - NO PAGEBREAK!

          // Impact strip
          ...(impactText ? [{
            text: impactText,
            fontSize: 9,
            bold: true,
            color: themeColors.primary,
            margin: [0, 0, 0, 8]
          }] : []),

          // Projects first: AI work leads
          { text: projectsTitle, style: 'sectionHeader', margin: [0, 0, 0, 5], keepWithNext: true },
          {
            stack: projectEntries.map((project, index) => ({
              stack: [project],
              pageBreakInside: 'avoid',
              margin: [0, 0, 0, (index === projectEntries.length - 1) ? 0 : 3]
            })),
            margin: [0, 0, 0, 6]
          },

          // Experience
          {
            text: experienceTitle,
            style: 'sectionHeader',
            margin: [0, 0, 0, 5],
            keepWithNext: true
          },
          {
            stack: jobEntries.map((job, index) => ({
              stack: [job],
              pageBreakInside: 'avoid',
              margin: [0, 0, 0, (index === jobEntries.length - 1) ? 0 : 3]
            })),
            margin: [0, 0, 0, 6]
          },

          // Stack
          { text: skillsTitle, style: 'sectionHeader', margin: [0, 0, 0, 5], keepWithNext: true },
          {
            stack: skillItems,
            margin: [0, 0, 0, 6]
          },

          // Two-column block - Education only (Skills moved to top)
          {
            table: {
              widths: ['100%'],
              dontBreakRows: true,
              body: [[
                {
                  stack: [
                    { text: educationTitle, style: 'sectionHeader', margin: [0, 0, 0, 5], keepWithNext: true },
                    {
                      stack: educationEntries.map(entry => ({
                        stack: [entry],
                        pageBreakInside: 'avoid'
                      }))
                    }
                  ],
                  border: [false, false, false, false]
                }
              ]]
            },
            layout: 'noBorders',
            margin: [0, 0, 0, 6]
          },
          
          // Two-column block - Languages and Hobbies (table keeps rows together on print)
          {
            table: {
              widths: ['48%', '4%', '48%'],
              dontBreakRows: true,
              body: [[
                {
                  stack: [
                    { text: languagesTitle, style: 'sectionHeader', margin: [0, 0, 0, 5], keepWithNext: true },
                    { stack: languageEntries },
                    { text: hobbiesTitle, style: 'sectionHeader', margin: [0, 10, 0, 5], keepWithNext: true },
                    { stack: hobbyEntries }
                  ],
                  border: [false, false, false, false]
                },
                { text: '', border: [false, false, false, false] },
                {
                  stack: [
                    ...(certificateEntries.length > 0 ? [
                      { text: certificatesTitle, style: 'sectionHeader', margin: [0, 0, 0, 5], keepWithNext: true },
                      { stack: certificateEntries }
                    ] : [])
                  ],
                  border: [false, false, false, false]
                }
              ]]
            },
            layout: 'noBorders'
          }
        ],
        
        // Footer
        footer: function(currentPage, pageCount) {
          return {
            columns: [
              { 
                text: `© ${new Date().getFullYear()} Andrii Mikhnevych`, 
                alignment: 'left',
                margin: [30, 0, 0, 0],
                fontSize: 8,
                color: themeColors.muted
              },
              { 
                text: `${currentPage} / ${pageCount}`, 
                alignment: 'right',
                margin: [0, 0, 30, 0],
                fontSize: 8,
                color: themeColors.muted
              }
            ]
          };
        },
        
        // Reduced styles
        styles: {
          sectionHeader: { 
            fontSize: 13, // Reduced font size
            bold: true, 
            color: themeColors.secondary, 
            decoration: 'underline',
            decorationStyle: 'solid',
            decorationColor: themeColors.primary
          },
          compactCard: {
            fillColor: themeColors.cardBg,
            borderRadius: 3,
            padding: [6, 5, 6, 5], // Reduced internal padding
            border: [1, 1, 1, 1],
            borderColor: themeColors.border,
            borderLeft: [3, 1, 1, 1],
            borderLeftColor: themeColors.primary,
            pageBreakInside: 'avoid' // Prevent breaks
          },
          jobTitle: {
            fontSize: 10,
            bold: true,
            color: themeColors.text,
            margin: [0, 0, 0, 1]
          },
          company: {
            fontSize: 8,
            color: themeColors.muted,
            margin: [0, 0, 0, 2]
          },
          dateLocation: {
            fontSize: 7,
            color: themeColors.muted
          },
          description: {
            fontSize: 8,
            color: themeColors.text,
            margin: [0, 2, 0, 2]
          },
          listItem: {
            fontSize: 8,
            color: themeColors.text,
            margin: [0, 0, 0, 1]
          },
          skillGroupTitle: {
            fontSize: 9, // Reduced font size
            bold: false,
            color: themeColors.text
          },
          tag: {
            fontSize: 8,
            color: themeColors.tagText,
            fillColor: themeColors.tagBg,
            borderRadius: 3,
            padding: [3, 2, 3, 2], // Reduced internal padding
            alignment: 'center'
          },
          compactLanguageRow: {
            borderBottom: [0.5, 'dashed', themeColors.border],
            paddingBottom: 2 // Reduced padding
          },
          languageName: {
            fontSize: 9,
            bold: true,
            color: themeColors.text
          },
          languageLevel: {
            fontSize: 8,
            color: themeColors.muted,
            italics: true
          },
          hobbyItem: {
            fontSize: 8,
            color: themeColors.text,
            lineHeight: 1.1 // Reduced line height
          }
        }
      };

      // Generate filename with language suffix
      const fileName = `Andrii_Mikhnevych_CV${getLangSuffix()}.pdf`;
      
      // Create the PDF
      const pdfDoc = pdfMake.createPdf(docDefinition);
      
      if (openInNewTab) {
        pdfDoc.open();
      } else {
        pdfDoc.download(fileName);
      }
      
  });
}
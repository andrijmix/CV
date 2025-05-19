function getBase64ImageFromURL(url, callback) {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = function () {
    // Сохраняем пропорции изображения
    const canvas = document.createElement('canvas');
    const originalRatio = this.naturalWidth / this.naturalHeight;
    canvas.width = this.naturalWidth;
    canvas.height = this.naturalHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this, 0, 0);
    
    const dataURL = canvas.toDataURL('image/jpeg');
    callback(dataURL, originalRatio);
  };
  img.onerror = function() {
    console.error('Failed to load image:', url);
    callback('', 1); // Empty string fallback
  };
  img.src = url;
}

function getQRCodeImage(url, callback) {
  const api = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(url)}`;
  getBase64ImageFromURL(api, callback);
}

function getLangSuffix() {
  const lang = document.documentElement.lang || 'en';
  return lang === 'uk' ? '_ua' : '_en';
}
function createCertificateEntries(detailsElement) {
  if (!detailsElement) return [];

  const certificateElements = detailsElement.querySelectorAll('.certificate');
  const certificateItems = [];

  certificateElements.forEach(cert => {
    const title = cert.querySelector('h3')?.innerText || '';
    const org = cert.querySelector('p')?.innerText || '';
    const year = cert.querySelector('span')?.innerText || '';

    const certCard = {
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
                  text: year,
                  style: 'dateLocation',
                  margin: [0, 1, 0, 0]
                }
              ],
              width: 'auto'
            }
          ]
        },
        {
          text: org,
          style: 'company',
          margin: [0, 2, 0, 0]
        }
      ],
      style: 'compactCard',
      margin: [0, 0, 0, 8]
    };

    certificateItems.push(certCard);
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
  
  jobElements.forEach(job => {
    const title = job.querySelector('h3')?.innerText;
    const company = job.querySelector('p:nth-of-type(1)')?.innerText;
    
    // Extract date and location
    let dateLocation = job.querySelector('p:nth-of-type(2)')?.innerText || '';
    
    // Separate date and location
    let datePart = '';
    let locationPart = '';
    
    if (dateLocation) {
      // Try to extract date and location parts
      const parts = dateLocation.replace('📅', '').replace('📍', '').split('  ');
      if (parts.length >= 2) {
        datePart = parts[0].trim();
        locationPart = parts[1].trim();
      } else {
        datePart = dateLocation;
      }
    }
    
    const description = job.querySelector('p:nth-of-type(3)')?.innerText;
    
    // Extract list items
    const listItems = [];
    job.querySelectorAll('li').forEach(li => {
      listItems.push(li.innerText);
    });
    
   // Create compact job card
    const jobCard = {
      stack: [
        { text: title || '', bold: true, fontSize: 12, margin: [0, 0, 0, 2] },
        { text: company || '', italics: true, fontSize: 10, margin: [0, 0, 0, 2] },
        {
          columns: [
            {
              width: 'auto',
              stack: [
                {
                  columns: [
                    createCalendarIcon(),
                    { text: datePart || '', fontSize: 9, margin: [2, 0, 0, 0] }
                  ],
                  columnGap: 2,
                  margin: [0, 0, 0, 1]
                },
                {
                  columns: [
                    createLocationIcon(),
                    { text: locationPart || '', fontSize: 9, margin: [2, 0, 0, 0] }
                  ],
                  columnGap: 2
                }
              ]
            }
          ]
        },
        { text: description || '', fontSize: 9, margin: [0, 2, 0, 2] },
        {
          ul: listItems.map(item => ({ text: item, fontSize: 9 })),
          margin: [0, 0, 0, 4]
        }
      ],
      margin: [0, 0, 0, 8]
    };
    
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
    const title = project.querySelector('h3')?.innerText;
    const description = project.querySelector('p')?.innerText;
    
    // Create compact project card
    const projectCard = {
      stack: [
        { text: title, style: 'jobTitle' },
        { text: description, style: 'description' }
      ],
      style: 'compactCard',
      margin: [0, 0, 0, 8]
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
      margin: [0, 0, 0, 8]
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
    // Create two-column layout for hobbies to save space
    const halfLength = Math.ceil(listItems.length / 2);
    const firstColumn = listItems.slice(0, halfLength);
    const secondColumn = listItems.slice(halfLength);
    
    return [{
      columns: [
        {
          ul: firstColumn.map(item => ({
            text: item,
            style: 'hobbyItem',
            margin: [0, 0, 0, 2]
          })),
          width: '50%'
        },
        {
          ul: secondColumn.map(item => ({
            text: item,
            style: 'hobbyItem',
            margin: [0, 0, 0, 2]
          })),
          width: '50%'
        }
      ],
      margin: [0, 3, 0, 0]
    }];
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
  // Store details open state
  const detailsStates = Array.from(document.querySelectorAll('details')).map(d => d.open);
  
  // Open all details for content extraction
  document.querySelectorAll('details').forEach(d => d.open = true);

  // Get theme state
  const isDarkTheme = document.body.classList.contains('dark');

  getBase64ImageFromURL('photo.jpg', function(photoData, photoRatio) {
    getQRCodeImage(window.location.href, function(qrCodeData) {
      // Get document language
      const isUkrainian = document.documentElement.lang === 'uk';
      
      // Extract header information
      const name = document.querySelector('header h1')?.innerText || 
                  document.querySelector('header p:nth-of-type(1)')?.innerText || 
                  'Andrii Mikhnevych';
      const title = document.querySelector('header p:nth-of-type(2)')?.innerText || 'Software Developer';
      const summary = document.querySelector('header p[style*="italic"]')?.innerText || '';
      const contact = document.querySelector('header p:last-of-type')?.innerText || '';
      
      // Get social links
      const socialLinks = getSocialLinks();

      // Get section details
      const details = document.querySelectorAll('section details');
      
      let certificatesDetail = null;
details.forEach(d => {
  const heading = d.querySelector('summary h2')?.innerText.toLowerCase() || '';
  if (heading.includes('certificate')) {
    certificatesDetail = d;
  }
});

const certificatesTitle = certificatesDetail?.querySelector('summary h2')?.innerText || (isUkrainian ? 'Сертифікати та курси' : 'Certificates and Courses');
const certificateEntries = createCertificateEntries(certificatesDetail);
      // Get section titles
      const experienceTitle = details[0]?.querySelector('summary h2')?.innerText || (isUkrainian ? 'Досвід' : 'Experience');
      const projectsTitle = details[1]?.querySelector('summary h2')?.innerText || (isUkrainian ? 'Проєкти' : 'Projects');
      const skillsTitle = details[2]?.querySelector('summary h2')?.innerText || (isUkrainian ? 'Навички' : 'Skills');
      const educationTitle = details[3]?.querySelector('summary h2')?.innerText || (isUkrainian ? 'Освіта' : 'Education');
      const languagesTitle = details[4]?.querySelector('summary h2')?.innerText || (isUkrainian ? 'Мови' : 'Languages');
      const hobbiesTitle = details[5]?.querySelector('summary h2')?.innerText || (isUkrainian ? 'Хобі' : 'Hobbies');

      // Create content sections
      const jobEntries = createJobEntries(details[0]);
      const projectEntries = createProjectEntries(details[1]);
      const skillItems = extractSkillGroups(details[2]);
      const educationEntries = createEducationEntries(details[3]);
      const languageEntries = createLanguageEntries(details[4]);
      const hobbyEntries = extractHobbies(details[5]);
      
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

      // Рассчитаем правильные размеры фото с сохранением пропорций
      const photoWidth = 70;
      const photoHeight = photoWidth / photoRatio;
      
      // Create social links section
      const socialLinksSection = socialLinks.length > 0 ? {
        stack: socialLinks.map(link => ({
          text: link.text,
          link: link.url,
          color: themeColors.primary,
          fontSize: 8,
          margin: [0, 1, 0, 0]
        })),
        margin: [0, 3, 0, 0]
      } : null;

      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [30, 30, 30, 40], // Increased bottom margin for footer
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
          // Compact header with photo and contact info
          {
            columns: [
              { 
                image: photoData, 
                width: photoWidth,
                height: photoHeight,
                margin: [0, 0, 15, 0] 
              },
              {
                width: '*',
                stack: [
                  { text: name, style: 'name' },
                  { text: title, style: 'role' },
                  { text: summary, style: 'summary' },
                  { text: contact, style: 'contact', link: 'mailto:andrijmix@gmail.com' },
                  socialLinksSection
                ].filter(Boolean) // Remove null items
              },
              { 
                image: qrCodeData, 
                width: 40, 
                alignment: 'right' 
              }
            ],
            margin: [0, 0, 0, 10]
          },
          // Separator line - blue line like on website
          {
            canvas: [{ 
              type: 'line', 
              x1: 0, y1: 0, 
              x2: 535, y2: 0, 
              lineWidth: 1, 
              color: themeColors.primary 
            }],
            margin: [0, 0, 0, 8]
          },
          // Main content in columns - MODIFIED to fix overflow issue
          {
            columns: [
    {
      width: '48%',
      stack: [
        { text: experienceTitle, style: 'sectionHeader', margin: [0, 0, 0, 5] },
        ...jobEntries.slice(0, 2),
      ],
    },
    {
      width: 1,
      canvas: [{ type: 'line', x1:0, y1:0, x2:0, y2:750, lineWidth:0.5, color: themeColors.border }]
    },
    {
      width: '48%',
      stack: [
        ...(jobEntries.length > 2 ? jobEntries.slice(2) : []),
        { text: projectsTitle, style: 'sectionHeader', margin: [0, 8, 0, 5] },
        ...projectEntries,
      ],
    }
  ],
  columnGap: 8
},

// Новая страница, первая колонка — Skills, Education, Languages
{
  pageBreak: 'before', // новая страница
  columns: [
    {
      width: '48%',
      stack: [
        { text: skillsTitle, style: 'sectionHeader', margin: [0, 0, 0, 3] },
        ...skillItems,
        { text: educationTitle, style: 'sectionHeader', margin: [0, 8, 0, 5] },
        ...educationEntries,
        { text: languagesTitle, style: 'sectionHeader', margin: [0, 8, 0, 5] },
        ...languageEntries,
      ],
    },
    {
      width: 1,
      canvas: [{ type: 'line', x1:0, y1:0, x2:0, y2:750, lineWidth:0.5, color: themeColors.border }]
    },
    {
      width: '48%',
      stack: [
        { text: certificatesTitle, style: 'sectionHeader', margin: [0, 0, 0, 5] },
        ...certificateEntries,
        { text: hobbiesTitle, style: 'sectionHeader', margin: [0, 8, 0, 5] },
        ...hobbyEntries,
      ],
    }
  ],
  columnGap: 8
          }
        ],
        // Centered footer
        footer: function() {
          return {
            text: `© ${new Date().getFullYear()} Andrii Mikhnevych`,
            alignment: 'center',
            fontSize: 8,
            margin: [0, 0, 0, 10],
            color: themeColors.muted
          };
        },
        styles: {
          // Уменьшены размеры всех элементов
          name: { 
            fontSize: 18, 
            bold: true, 
            margin: [0, 0, 0, 3],
            color: themeColors.text
          },
          role: { 
            fontSize: 12, 
            margin: [0, 0, 0, 2], 
            color: themeColors.muted
          },
          contact: { 
            fontSize: 9, 
            color: themeColors.primary, 
            margin: [0, 3, 0, 0] 
          },
          summary: { 
            fontSize: 9, 
            italics: true,
            margin: [0, 3, 0, 3], 
            color: themeColors.muted
          },
          sectionHeader: { 
            fontSize: 14, 
            bold: true, 
            color: themeColors.secondary, 
            decoration: 'underline',
            decorationStyle: 'solid',
            decorationColor: themeColors.primary
          },
          compactCard: {
            fillColor: themeColors.cardBg,
            borderRadius: 3,
            padding: [8, 6, 8, 6],
            border: [1, 1, 1, 1],
            borderColor: themeColors.border,
            // Left blue border like on website
            borderLeft: [3, 1, 1, 1],
            borderLeftColor: themeColors.primary
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
            fontSize: 10,
            bold: false,
            color: themeColors.text
          },
          tag: {
            fontSize: 8,
            color: themeColors.tagText,
            fillColor: themeColors.tagBg,
            borderRadius: 3,
            padding: [4, 2, 4, 2],
            alignment: 'center'
          },
          compactLanguageRow: {
            borderBottom: [0.5, 'dashed', themeColors.border],
            paddingBottom: 3
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
            lineHeight: 1.2
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
      
      // Restore details state
      document.querySelectorAll('details').forEach((detail, index) => {
        if (index < detailsStates.length) {
          detail.open = detailsStates[index];
        }
      });
    });
  });
}
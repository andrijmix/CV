<!-- Add this to your <head> section -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

<script>
function generatePDF() {
  // Get all details elements and open them
  const details = document.querySelectorAll('details');
  details.forEach(detail => detail.setAttribute('open', true));
  
  // Create a special version of the body for PDF generation
  const element = document.body.cloneNode(true);
  
  const opt = {
    margin:       [10, 10, 10, 10],
    filename:     'andrii_mikhnevych_cv.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: true, backgroundColor: '#ffffff' },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  // Generate the PDF
  html2pdf().set(opt).from(element).save().then(() => {
    // Close all details elements after PDF is generated
    details.forEach(detail => detail.removeAttribute('open'));
  });
}
</script>
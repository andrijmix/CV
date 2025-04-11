// Function to handle details click with the onclick attribute
function toggleDetails(clicked) {
  // Stop event propagation to avoid double triggering
  event.stopPropagation();
  
  // No additional logic needed - just let the native details/summary behavior work
  // We're keeping this function for backwards compatibility with existing onclick attributes
}

// When DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add smooth scrolling behavior when a details element is opened
  document.querySelectorAll('details').forEach((detail) => {
    detail.addEventListener('toggle', () => {
      if (detail.open) {
        // Scroll to the opened details element
        detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});
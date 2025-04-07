function toggleDetails(clicked) {
    document.querySelectorAll('details').forEach((el) => {
      if (el !== clicked) el.removeAttribute('open');
    });
  }
  
  document.querySelectorAll('details').forEach((detail) => {
    detail.addEventListener('toggle', () => {
      if (detail.open) {
        document.querySelectorAll('details').forEach((other) => {
          if (other !== detail) other.removeAttribute('open');
        });
        detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
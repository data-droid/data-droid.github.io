// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const siteNav = document.querySelector('.site-nav');
  
  if (mobileMenuToggle && siteNav) {
    mobileMenuToggle.addEventListener('click', function() {
      this.classList.toggle('active');
      siteNav.classList.toggle('active');
    });
  }
  
  // Mobile dropdown toggle
  const dropdowns = document.querySelectorAll('.dropdown');
  
  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle');
    const menu = dropdown.querySelector('.dropdown-menu');
    
    if (toggle && menu) {
      toggle.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Close other dropdowns
        dropdowns.forEach(otherDropdown => {
          if (otherDropdown !== dropdown) {
            otherDropdown.classList.remove('active');
          }
        });
        
        // Toggle current dropdown
        dropdown.classList.toggle('active');
      });
    }
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.site-nav') && !e.target.closest('.mobile-menu-toggle')) {
      // Close mobile menu
      if (mobileMenuToggle && siteNav) {
        mobileMenuToggle.classList.remove('active');
        siteNav.classList.remove('active');
      }
      
      // Close dropdowns
      dropdowns.forEach(dropdown => {
        dropdown.classList.remove('active');
      });
    }
  });
  
  // Close menu when clicking on a link
  const navLinks = document.querySelectorAll('.site-nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (mobileMenuToggle && siteNav) {
        mobileMenuToggle.classList.remove('active');
        siteNav.classList.remove('active');
      }
    });
  });
  
  // Smooth scrolling for anchor links
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

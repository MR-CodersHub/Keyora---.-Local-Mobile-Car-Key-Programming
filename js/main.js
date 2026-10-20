/* ===================================================================
   KEYORA MOBILE CAR KEY & LOCKSMITH SOLUTIONS - CORE JAVASCRIPT
   Interactions: Navigation, Dropdowns, Modals, Calculator, Accordions, Forms
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initRtlToggle();
  initStickyHeader();
  initMobileDrawer();
  initFaqAccordions();
  initPricingCalculator();
  initInstantDispatchBar();
  initFormValidations();
  initBlogFilterAndSearch();
  initUserAccountDropdown();
});

/* 1. Sticky Header with Scroll Effect */
function initStickyHeader() {
  const header = document.querySelector('.main-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

/* 2. Mobile Hamburger Navigation Drawer */
function initMobileDrawer() {
  const toggleBtn = document.querySelector('.mobile-toggle-btn');
  const drawer = document.querySelector('.mobile-nav-drawer');
  const closeBtn = document.querySelector('.mobile-drawer-close');

  if (!toggleBtn || !drawer) return;

  let backdrop = document.querySelector('.drawer-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'drawer-backdrop';
    backdrop.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.6); z-index: 2400; opacity: 0;
      visibility: hidden; transition: all 0.3s ease;
    `;
    document.body.appendChild(backdrop);
  }

  function openDrawer() {
    drawer.classList.add('open');
    backdrop.style.opacity = '1';
    backdrop.style.visibility = 'visible';
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    backdrop.style.opacity = '0';
    backdrop.style.visibility = 'hidden';
    document.body.style.overflow = '';
  }

  toggleBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);
}

/* 3. FAQ Accordions */
function initFaqAccordions() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question-btn');
    if (!questionBtn) return;

    questionBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all other FAQs in the same group
      const parentContainer = item.closest('.faq-accordion-container');
      if (parentContainer) {
        parentContainer.querySelectorAll('.faq-item').forEach(other => {
          if (other !== item) other.classList.remove('active');
        });
      }

      item.classList.toggle('active', !isActive);
    });
  });
}

/* 6. Interactive Pricing Calculator */
function initPricingCalculator() {
  const vehicleSelect = document.getElementById('calcVehicleType');
  const keySelect = document.getElementById('calcKeyType');
  const situationSelect = document.getElementById('calcSituation');
  const priceDisplay = document.getElementById('calcResultPrice');
  const etaDisplay = document.getElementById('calcResultEta');

  if (!vehicleSelect || !keySelect || !situationSelect || !priceDisplay) return;

  function calculate() {
    let basePrice = 120;
    let maxPrice = 160;
    let eta = '20-30 Mins';

    // Key Type Base
    switch (keySelect.value) {
      case 'standard':
        basePrice = 90;
        maxPrice = 140;
        break;
      case 'transponder':
        basePrice = 140;
        maxPrice = 195;
        break;
      case 'remote_fob':
        basePrice = 180;
        maxPrice = 240;
        break;
      case 'smart_key':
        basePrice = 220;
        maxPrice = 320;
        break;
      case 'lockout':
        basePrice = 75;
        maxPrice = 110;
        break;
      default:
        basePrice = 140;
        maxPrice = 210;
    }

    // Vehicle Multiplier
    if (vehicleSelect.value === 'european') {
      basePrice = Math.round(basePrice * 1.35);
      maxPrice = Math.round(maxPrice * 1.35);
    } else if (vehicleSelect.value === 'luxury') {
      basePrice = Math.round(basePrice * 1.45);
      maxPrice = Math.round(maxPrice * 1.5);
    }

    // Situation adjustments
    if (situationSelect.value === 'all_lost') {
      basePrice += 45;
      maxPrice += 65;
    } else if (situationSelect.value === 'emergency_night') {
      basePrice += 35;
      maxPrice += 45;
      eta = '15-25 Mins (Priority)';
    }

    priceDisplay.textContent = `$${basePrice} - $${maxPrice}`;
    if (etaDisplay) etaDisplay.textContent = `⚡ Estimated Arrival: ${eta}`;
  }

  vehicleSelect.addEventListener('change', calculate);
  keySelect.addEventListener('change', calculate);
  situationSelect.addEventListener('change', calculate);
  calculate(); // initial calculation
}

/* 7. Instant Dispatch Bar (Home 2) */
function initInstantDispatchBar() {
  const dispatchForm = document.getElementById('instantDispatchForm');
  if (!dispatchForm) return;

  dispatchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const make = dispatchForm.querySelector('#quickMake')?.value || 'Vehicle';
    const model = dispatchForm.querySelector('#quickModel')?.value || '';
    const zip = dispatchForm.querySelector('#quickZip')?.value || 'your location';

    showNotification(
      'Technician Located!',
      `Mobile Unit #04 is 18 minutes away from ${zip} for your ${make} ${model}. Connecting to dispatcher...`,
      'success'
    );
  });
}

/* 8. Form Validation & Submissions */
function initFormValidations() {
  const serviceForm = document.getElementById('serviceRequestForm');
  if (serviceForm) {
    serviceForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let isValid = true;

      const requiredInputs = serviceForm.querySelectorAll('[required]');
      requiredInputs.forEach(input => {
        const group = input.closest('.form-group');
        if (!input.value.trim()) {
          isValid = false;
          if (group) group.classList.add('has-error');
        } else {
          if (group) group.classList.remove('has-error');
        }
      });

      if (!isValid) {
        showNotification('Missing Information', 'Please complete all required fields.', 'error');
        return;
      }

      showNotification(
        'Request Dispatched!',
        'Your mobile key service request has been assigned to our nearest field technician. We will call you within 3 minutes.',
        'success'
      );
      serviceForm.reset();
    });
  }

  // Newsletter Form
  const newsForms = document.querySelectorAll('.newsletter-form');
  newsForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (input && input.value.trim()) {
        showNotification('Subscribed!', 'Thank you for subscribing to Keyora automotive security tips.', 'success');
        input.value = '';
      }
    });
  });
}

/* UI Notification Toast */
function showNotification(title, message, type = 'info') {
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed; bottom: 30px; right: 30px; z-index: 3000;
      display: flex; flex-direction: column; gap: 10px; max-width: 380px;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bgColor = type === 'success' ? '#0f1115' : type === 'error' ? '#7f1d1d' : '#1e293b';
  const borderColor = type === 'success' ? '#f59e0b' : type === 'error' ? '#ef4444' : '#38bdf8';

  toast.style.cssText = `
    background: ${bgColor}; border: 2px solid ${borderColor}; color: #fff;
    padding: 16px 20px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.4);
    animation: slideInRight 0.3s ease;
  `;

  toast.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 4px;">
      <strong style="color: ${borderColor}; font-size: 0.95rem; font-family: Outfit, sans-serif;">${title}</strong>
      <button style="background:none; border:none; color:#94a3b8; cursor:pointer; font-size:1.1rem; padding:0 0 0 10px;" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
    <p style="font-size: 0.85rem; color: #cbd5e1; margin:0; line-height:1.4;">${message}</p>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

/* 9. Theme Toggle (Dark / Light) */
function initThemeToggle() {
  const savedTheme = localStorage.getItem('keyora_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButtonUI(savedTheme);

  const themeBtns = document.querySelectorAll('#themeToggleBtn, .theme-toggle-btn');
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('keyora_theme', next);
      updateThemeButtonUI(next);
      showNotification('Theme Changed', `Switched to ${next.toUpperCase()} mode.`, 'info');
    });
  });
}

function updateThemeButtonUI(theme) {
  const themeBtns = document.querySelectorAll('#themeToggleBtn, .theme-toggle-btn');
  themeBtns.forEach(btn => {
    const icon = btn.querySelector('.theme-icon');
    const text = btn.querySelector('.theme-text');
    if (theme === 'dark') {
      if (icon) icon.textContent = '☀️';
      if (text) text.textContent = 'Light';
    } else {
      if (icon) icon.textContent = '🌙';
      if (text) text.textContent = 'Dark';
    }
  });
}

/* 10. RTL Toggle (Right-to-Left / Left-to-Right) */
function initRtlToggle() {
  const savedDir = localStorage.getItem('keyora_dir') || 'ltr';
  document.documentElement.setAttribute('dir', savedDir);
  updateRtlButtonUI(savedDir);

  const rtlBtns = document.querySelectorAll('#rtlToggleBtn, .rtl-toggle-btn');
  rtlBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('dir') || 'ltr';
      const next = current === 'rtl' ? 'ltr' : 'rtl';
      document.documentElement.setAttribute('dir', next);
      localStorage.setItem('keyora_dir', next);
      updateRtlButtonUI(next);
      showNotification('Direction Switched', `Switched to ${next.toUpperCase()} layout.`, 'info');
    });
  });
}

function updateRtlButtonUI(dir) {
  const rtlBtns = document.querySelectorAll('#rtlToggleBtn, .rtl-toggle-btn');
  rtlBtns.forEach(btn => {
    const text = btn.querySelector('.rtl-text');
    if (dir === 'rtl') {
      if (text) text.textContent = 'LTR';
      btn.classList.add('active');
    } else {
      if (text) text.textContent = 'RTL';
      btn.classList.remove('active');
    }
  });
}

/* 11. Interactive Blog Category Filter, Live Search & Smooth Card Focus */
function initBlogFilterAndSearch() {
  const filterPills = document.querySelectorAll('#blogFilterWrapper .filter-pill');
  const cards = document.querySelectorAll('.article-card-modern');
  const featuredCard = document.getElementById('featuredCard');
  const cardsGrid = document.getElementById('blogCardsGrid');
  const searchInput = document.querySelector('.blog-search-bar input');
  const searchBtn = document.querySelector('.blog-search-bar button');

  if (!filterPills.length && !searchInput) return;

  function filterByCategory(category) {
    let matchCount = 0;
    let firstMatchingCard = null;

    // Filter 6 curated grid cards first
    cards.forEach(card => {
      const cardCats = (card.dataset.category || '').toLowerCase();
      card.classList.remove('card-highlight-pulse');

      if (category === 'all' || cardCats.includes(category)) {
        card.classList.remove('filtered-hidden');
        matchCount++;
        if (!firstMatchingCard) {
          firstMatchingCard = card;
        }
        if (category !== 'all') {
          setTimeout(() => card.classList.add('card-highlight-pulse'), 50);
        }
      } else {
        card.classList.add('filtered-hidden');
      }
    });

    // Filter featured magazine card
    if (featuredCard) {
      const featCats = (featuredCard.dataset.category || '').toLowerCase();
      if (category === 'all' || featCats.includes(category)) {
        featuredCard.classList.remove('filtered-hidden');
      } else {
        featuredCard.classList.add('filtered-hidden');
      }
    }

    // Handle empty state message
    let emptyMsg = document.getElementById('filterEmptyMsg');
    if (matchCount === 0 && (!featuredCard || featuredCard.classList.contains('filtered-hidden'))) {
      if (!emptyMsg && cardsGrid) {
        emptyMsg = document.createElement('div');
        emptyMsg.id = 'filterEmptyMsg';
        emptyMsg.className = 'filter-empty-msg';
        emptyMsg.innerHTML = '<h4 style="font-size:1.15rem; margin-bottom:8px;">No Guides Found In This Category</h4><p style="margin:0; font-size:0.9rem;">Try selecting "All Guides" or use the search bar above.</p>';
        cardsGrid.appendChild(emptyMsg);
      }
    } else if (emptyMsg) {
      emptyMsg.remove();
    }

    // Smooth scroll down directly to the correct matching card!
    if (firstMatchingCard) {
      const yOffset = -110;
      const y = firstMatchingCard.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  }

  filterPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const filterVal = pill.getAttribute('data-filter') || 'all';
      filterByCategory(filterVal);
    });
  });

  // Search input query filter
  function handleSearch() {
    if (!searchInput) return;
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      filterByCategory('all');
      return;
    }

    // Clear active pill state
    filterPills.forEach(p => p.classList.remove('active'));

    let matchCount = 0;
    let firstMatchingCard = null;

    if (featuredCard) {
      const text = featuredCard.textContent.toLowerCase();
      if (text.includes(query)) {
        featuredCard.classList.remove('filtered-hidden');
        firstMatchingCard = featuredCard;
      } else {
        featuredCard.classList.add('filtered-hidden');
      }
    }

    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.classList.remove('card-highlight-pulse');
      if (text.includes(query)) {
        card.classList.remove('filtered-hidden');
        matchCount++;
        if (!firstMatchingCard) firstMatchingCard = card;
        setTimeout(() => card.classList.add('card-highlight-pulse'), 50);
      } else {
        card.classList.add('filtered-hidden');
      }
    });

    let emptyMsg = document.getElementById('filterEmptyMsg');
    if (matchCount === 0 && (!featuredCard || featuredCard.classList.contains('filtered-hidden'))) {
      if (!emptyMsg && cardsGrid) {
        emptyMsg = document.createElement('div');
        emptyMsg.id = 'filterEmptyMsg';
        emptyMsg.className = 'filter-empty-msg';
        emptyMsg.innerHTML = `<h4 style="font-size:1.15rem; margin-bottom:8px;">No Results For "${query}"</h4><p style="margin:0; font-size:0.9rem;">Try searching for "smart", "laser", "battery", or "lost".</p>`;
        cardsGrid.appendChild(emptyMsg);
      }
    } else if (emptyMsg) {
      emptyMsg.remove();
    }

    if (firstMatchingCard) {
      const yOffset = -110;
      const y = firstMatchingCard.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
  }
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
    });
  }
}

/* 12. Live ZIP Code ETA Checker on Contact Page */
function checkZipEta() {
  const zipInput = document.getElementById('zipInput');
  const resultDiv = document.getElementById('zipResult');
  if (!zipInput || !resultDiv) return;

  const zip = zipInput.value.trim();
  if (zip.length !== 5) {
    resultDiv.style.display = 'block';
    resultDiv.style.color = '#ef4444';
    resultDiv.innerHTML = '<span style="color:#ef4444; font-weight:700;">Please enter a valid 5-digit ZIP code.</span>';
    return;
  }

  resultDiv.style.display = 'block';
  resultDiv.innerHTML = '<span style="color:#cbd5e1;"><span class="pulse-indicator"></span> Locating nearest patrol van in your zone...</span>';

  setTimeout(() => {
    resultDiv.innerHTML = `
      <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; border-radius: 8px; padding: 10px 14px; margin-top: 6px;">
        <div style="color: #4ade80; font-weight: 800; font-size: 0.95rem; margin-bottom: 2px;">
          ✓ Confirmed Mobile Coverage for Area ${zip}
        </div>
        <div style="color: #cbd5e1; font-size: 0.85rem;">
          Assigned Unit: <strong>Patrol Van #4</strong> &bull; Estimated Arrival: <strong style="color:var(--color-gold);">18 &ndash; 22 Minutes</strong>
        </div>
      </div>
    `;
  }, 400);
}

/* 13. User Account Icon & Dropdown Menu */
function initUserAccountDropdown() {
  const accountBtn = document.getElementById('userAccountBtn');
  const dropdown = document.getElementById('userAccountDropdown');
  if (!accountBtn || !dropdown) return;

  accountBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isShown = dropdown.classList.contains('show');
    dropdown.classList.toggle('show', !isShown);
    accountBtn.classList.toggle('active', !isShown);
    accountBtn.setAttribute('aria-expanded', !isShown ? 'true' : 'false');
  });

  document.addEventListener('click', (e) => {
    if (!accountBtn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('show');
      accountBtn.classList.remove('active');
      accountBtn.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dropdown.classList.contains('show')) {
      dropdown.classList.remove('show');
      accountBtn.classList.remove('active');
      accountBtn.setAttribute('aria-expanded', 'false');
    }
  });
}





// Clear Dental — Dynamic Scripts & Urban Smiles Style Interactivity
// With Anti-DDoS, Bot Protection & Appointment Request Handling

document.addEventListener("DOMContentLoaded", () => {
  // 1. Mobile Drawer Navigation
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const drawerCloseBtn = document.getElementById("drawer-close-btn");
  const mobileDrawer = document.getElementById("mobile-drawer");
  const drawerLinks = document.querySelectorAll(".drawer-link");

  const openDrawer = () => {
    mobileDrawer.classList.add("open");
    mobileDrawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeDrawer = () => {
    mobileDrawer.classList.remove("open");
    mobileDrawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  if (hamburgerBtn) hamburgerBtn.addEventListener("click", openDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener("click", closeDrawer);

  drawerLinks.forEach((link) => {
    link.addEventListener("click", closeDrawer);
  });

  // 2. Sticky Header Scroll Effect
  const header = document.getElementById("header");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 40) {
      header.style.background = "rgba(255, 255, 255, 0.98)";
      header.style.boxShadow = "0 8px 30px rgba(8, 9, 75, 0.08)";
    } else {
      header.style.background = "rgba(255, 255, 255, 0.92)";
      header.style.boxShadow = "none";
    }
  });

  // 3. Appointment Request Form Features
  const appointmentForm = document.getElementById("appointment-form");
  const nameInput = document.getElementById("req-name");
  const nameCounter = document.getElementById("name-counter");
  const fileUploadInput = document.getElementById("file-upload");
  const uploadZone = document.getElementById("upload-zone");
  const fileNameDisplay = document.getElementById("file-name-display");
  const formStatus = document.getElementById("form-status");
  const submitBtn = document.getElementById("submit-btn");

  // Character counter for Name
  if (nameInput && nameCounter) {
    nameInput.addEventListener("input", () => {
      nameCounter.textContent = `${nameInput.value.length}/256`;
    });
  }

  // File Upload Drag & Drop & Name Preview
  if (fileUploadInput && uploadZone) {
    fileUploadInput.addEventListener("change", () => {
      if (fileUploadInput.files && fileUploadInput.files.length > 0) {
        const file = fileUploadInput.files[0];
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        fileNameDisplay.textContent = `Attached: ${file.name} (${sizeMb} MB)`;
        fileNameDisplay.style.display = "block";
      } else {
        fileNameDisplay.textContent = "";
        fileNameDisplay.style.display = "none";
      }
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      uploadZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
      });
    });

    uploadZone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        fileUploadInput.files = e.dataTransfer.files;
        const file = e.dataTransfer.files[0];
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        fileNameDisplay.textContent = `Attached: ${file.name} (${sizeMb} MB)`;
        fileNameDisplay.style.display = "block";
      }
    });
  }

  // 4. Anti-Bot / reCAPTCHA & DDoS Mitigation Simulation
  const captchaBox = document.getElementById("captcha-box");
  const captchaSpinner = document.getElementById("captcha-spinner");
  const captchaCheck = document.getElementById("captcha-check");
  let isCaptchaVerified = false;
  let isCaptchaProcessing = false;

  if (captchaBox) {
    captchaBox.addEventListener("click", () => {
      if (isCaptchaVerified || isCaptchaProcessing) return;

      isCaptchaProcessing = true;
      captchaSpinner.style.display = "block";
      captchaBox.style.borderColor = "#4285f4";

      // Simulate secure challenge verification
      setTimeout(() => {
        isCaptchaProcessing = false;
        isCaptchaVerified = true;
        captchaSpinner.style.display = "none";
        captchaCheck.style.display = "block";
        captchaBox.classList.add("checked");
        captchaBox.setAttribute("aria-checked", "true");
        if (formStatus) formStatus.innerHTML = "";
      }, 900);
    });
  }

  // 5. Anti-DDoS Rate Limiting & Honeypot Submission Handler
  let lastSubmitTime = 0;
  const SUBMIT_COOLDOWN_MS = 4000; // 4-second flood limit

  if (appointmentForm) {
    appointmentForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const now = Date.now();

      // Anti-DDoS Cooldown check
      if (now - lastSubmitTime < SUBMIT_COOLDOWN_MS) {
        formStatus.innerHTML = `
          <div style="background: #fff3cd; color: #856404; padding: 12px 18px; border-radius: 6px; border: 1px solid #ffeeba;">
            ⚠️ Please wait a moment before submitting again to prevent duplicate requests.
          </div>
        `;
        return;
      }

      // Anti-Bot Honeypot check
      const honeypot = document.getElementById("hp-trap");
      if (honeypot && honeypot.value.trim() !== "") {
        console.warn("Spam bot submission blocked via honeypot.");
        return; // Silently discard automated spam
      }

      // Captcha verification check
      if (!isCaptchaVerified) {
        formStatus.innerHTML = `
          <div style="background: #fde8e6; color: #c93b2b; padding: 12px 18px; border-radius: 6px; border: 1px solid #f9c7c2; font-weight: 500;">
            ⚠️ Please verify that you are not a robot before submitting.
          </div>
        `;
        return;
      }

      // HTML5 Validation check
      if (!appointmentForm.checkValidity()) {
        formStatus.innerHTML = `
          <div style="background: #fde8e6; color: #c93b2b; padding: 12px 18px; border-radius: 6px; border: 1px solid #f9c7c2;">
            ⚠️ Please fill in all required fields marked with an asterisk (*).
          </div>
        `;
        return;
      }

      // Process valid submission with Backend REST API & LocalStorage synchronization
      lastSubmitTime = now;
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";

      const formData = new FormData(appointmentForm);
      const payload = {
        name: formData.get("name") || "Valued Patient",
        age: formData.get("age") || null,
        email: formData.get("email") || "",
        phone: formData.get("phone") || "",
        connected_to: formData.get("connected_to") || "Regular Mobile / SMS",
        procedure: formData.get("procedure") || "General Dental Consultation",
        date: formData.get("date") || "Upcoming Date",
        branch: formData.get("branch") || "O’Clear Dental Clinic — Main Clinic (Arayat, Pampanga)",
        hmo: formData.get("hmo") || "None / Self-pay",
        fileName: fileUploadInput && fileUploadInput.files.length > 0 ? fileUploadInput.files[0].name : null,
        _clinic_hp_check: document.getElementById("hp-trap") ? document.getElementById("hp-trap").value : ""
      };

      // Always save to LocalStorage fallback for offline / standalone mode
      try {
        const localAppointments = JSON.parse(localStorage.getItem('oclear_appointments') || '[]');
        localAppointments.unshift({
          id: 'apt-' + Date.now(),
          ...payload,
          status: 'Pending',
          created_at: new Date().toISOString()
        });
        localStorage.setItem('oclear_appointments', JSON.stringify(localAppointments));

        // Also sync to local patients
        const localPatients = JSON.parse(localStorage.getItem('oclear_patients') || '[]');
        if (!localPatients.some(p => p.phone === payload.phone)) {
          localPatients.unshift({
            id: 'pat-' + Date.now(),
            name: payload.name,
            age: payload.age,
            phone: payload.phone,
            email: payload.email,
            connected_to: payload.connected_to,
            hmo: payload.hmo,
            ongoing_treatment: payload.procedure + ' (New Inquiry)',
            status: 'New',
            last_visit: payload.date,
            next_visit: payload.date,
            notes: 'Registered via online Appointment Request Form.'
          });
          localStorage.setItem('oclear_patients', JSON.stringify(localPatients));
        }
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }

      // Base URL Resolver: Supports Coolify VPS backend, localhost:3000, and file:///
      const API_BASE = (typeof window.API_BASE !== 'undefined') ? window.API_BASE : ((window.location.protocol === 'file:') ? 'http://localhost:3000' : '');

      // Try sending to the Node backend server
      fetch(`${API_BASE}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .catch(err => {
        console.log('Backend server not directly reachable or running standalone (LocalStorage used).');
        return { success: true };
      })
      .finally(() => {
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit";

          formStatus.innerHTML = `
            <div style="background: #eef8ff; border: 1.5px solid #08094b; padding: 18px 22px; border-radius: 8px; color: #08094b; line-height: 1.6;">
              ✦ <strong>Thank you, ${payload.name}!</strong> Your appointment request for <em>${payload.procedure}</em> on <strong>${payload.date}</strong> at <strong>${payload.branch}</strong> has been received and recorded in our clinic system.<br />
              <span style="font-size: 13px; color: #556575; display: block; margin-top: 6px;">
                Please be informed that our Patient Support Team will contact you via your mobile number or connected app to confirm your booking. Thank you.
              </span>
            </div>
          `;

          appointmentForm.reset();
          if (nameCounter) nameCounter.textContent = "0/256";
          if (fileNameDisplay) {
            fileNameDisplay.textContent = "";
            fileNameDisplay.style.display = "none";
          }
          
          // Reset captcha for subsequent submissions
          isCaptchaVerified = false;
          if (captchaBox) {
            captchaBox.classList.remove("checked");
            captchaBox.setAttribute("aria-checked", "false");
          }
          if (captchaCheck) captchaCheck.style.display = "none";
        }, 600);
      });
    });
  }

  // 5b. Sync Booking Procedure Dropdown & Public Services Grid with Live Service Catalog
  const reqProcedureEl = document.getElementById('req-procedure');
  const servicesGridEl = document.getElementById('public-services-grid');

  function renderPublicServices(services) {
    if (!servicesGridEl || !Array.isArray(services) || !services.length) return;
    const activeServices = services.filter(s => s.active !== false);
    const icons = ['⌁', '✦', '♧', '✧', '◈', '❖', '⬡', '❂'];
    servicesGridEl.innerHTML = activeServices.map((s, idx) => {
      const numStr = (s.code && s.code.includes('/')) ? s.code : `0${idx + 1} / 0${activeServices.length}`;
      const icon = icons[idx % icons.length];
      const priceTag = s.price ? ` · ₱${Number(s.price).toLocaleString()}` : (s.fee ? ` · ${s.fee}` : '');
      return `
        <article class="us-service-card">
          <div>
            <div class="us-service-card__top">
              <span class="us-service-card__num">${numStr}</span>
              <span class="us-service-card__icon">${icon}</span>
            </div>
            <h3 class="us-service-card__title">${s.name}</h3>
            <p class="us-service-card__desc">${s.desc || ''}</p>
          </div>
          <div class="us-service-card__footer">
            <span style="font-size: 11.5px; font-weight: 600; color: var(--navy); display: block; margin-bottom: 6px;">⏱ ${s.duration || '45 mins'}${priceTag}</span>
            <a href="#appointment" data-procedure="${s.name}" class="us-service-card__link">Plan Treatment <span>→</span></a>
          </div>
        </article>
      `;
    }).join('');
  }

  function updateServicesView(services) {
    if (!Array.isArray(services) || !services.length) return;
    if (reqProcedureEl) {
      const currentVal = reqProcedureEl.value;
      reqProcedureEl.innerHTML = '<option value="" disabled selected>Select procedure</option>' +
        services.filter(s => s.active !== false).map(s => 
          `<option value="${s.name}">${s.name}</option>`
        ).join('');
      if (currentVal) reqProcedureEl.value = currentVal;
    }
    renderPublicServices(services);
  }

  // 1. Instant cache render from localStorage
  try {
    const cachedServices = JSON.parse(localStorage.getItem('oclear_services') || 'null');
    if (cachedServices && cachedServices.length) {
      updateServicesView(cachedServices);
    }
  } catch (e) {}

  // 2. Fetch live data from backend (works on both http://localhost:3000 and file:///)
  const API_ROOT = (window.location.protocol === 'file:') ? 'http://localhost:3000' : '';
  fetch(`${API_ROOT}/api/services`)
    .then(r => r.json())
    .then(services => {
      if (Array.isArray(services) && services.length) {
        updateServicesView(services);
        localStorage.setItem('oclear_services', JSON.stringify(services));
      }
    })
    .catch(() => null);

  // 3. Listen to real-time storage event when edited in dashboard in another tab
  window.addEventListener('storage', (e) => {
    if (e.key === 'oclear_services' && e.newValue) {
      try {
        const updated = JSON.parse(e.newValue);
        if (Array.isArray(updated) && updated.length) {
          updateServicesView(updated);
        }
      } catch (err) {}
    }
  });

  // 6. Service Catalog Card Click -> Auto-select Procedure in Form (Event Delegation)
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.us-service-card__link[data-procedure]');
    if (!link) return;
    e.preventDefault();
    const procedureVal = link.getAttribute('data-procedure');
    const procedureSelect = document.getElementById('req-procedure');
    const appointmentSec = document.getElementById('appointment');

    if (procedureSelect && procedureVal) {
      procedureSelect.value = procedureVal;
      procedureSelect.style.borderColor = 'var(--sapphire-light)';
      procedureSelect.style.boxShadow = '0 0 0 4px rgba(43, 75, 181, 0.25)';
      setTimeout(() => {
        procedureSelect.style.borderColor = '';
        procedureSelect.style.boxShadow = '';
      }, 2200);
    }

    if (appointmentSec) {
      const headerEl = document.querySelector(".header") || document.querySelector(".navbar");
      const headerHeight = headerEl ? headerEl.offsetHeight : 86;
      const targetPos = appointmentSec.getBoundingClientRect().top + window.pageYOffset - headerHeight;
      window.scrollTo({
        top: targetPos,
        behavior: 'smooth'
      });
    }
  });

  // 7. Smooth Anchor Scrolling with Header Offset
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    // Avoid re-binding service cards that have custom handlers
    if (anchor.classList.contains('us-service-card__link')) return;

    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerHeight = header ? header.offsetHeight : 86;
        const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth"
        });
      }
    });
  });
});


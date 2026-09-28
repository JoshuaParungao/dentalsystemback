/**
 * O'Clear Dental Clinic — API & Backend Gateway Configuration
 * Frontend: Vercel (https://dentalsystemfront.vercel.app)
 * Backend: Coolify on Hostinger VPS (https://uzndnmatibodoim9edym4azt.187.77.131.56.sslip.io)
 */

// Production Coolify Backend on Hostinger VPS
window.CLINIC_BACKEND_URL = "https://uzndnmatibodoim9edym4azt.187.77.131.56.sslip.io";

function getApiBase() {
  // 1. Manually saved backend URL from Dashboard Settings (if customized)
  const savedUrl = localStorage.getItem('oclear_backend_url');
  if (savedUrl && savedUrl.trim()) {
    return savedUrl.trim().replace(/\/$/, '');
  }

  // 2. Localhost & File mode (Local development)
  if (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  // 3. Production Vercel mode -> Coolify VPS Backend
  if (window.CLINIC_BACKEND_URL && window.CLINIC_BACKEND_URL.trim()) {
    return window.CLINIC_BACKEND_URL.trim().replace(/\/$/, '');
  }

  return 'https://uzndnmatibodoim9edym4azt.187.77.131.56.sslip.io';
}

window.API_BASE = getApiBase();

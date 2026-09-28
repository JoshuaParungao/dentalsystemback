/**
 * O'Clear Dental Clinic — High-Performance Node.js Backend Server
 * Native HTTP server with JSON file persistence, REST API, Semaphore SMS, and Resend Email
 * Run with: node server.js
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const APPOINTMENTS_FILE = path.join(DATA_DIR, 'appointments.json');
const PATIENTS_FILE = path.join(DATA_DIR, 'patients.json');
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');
const INVENTORY_FILE = path.join(DATA_DIR, 'inventory.json');
const BILLING_FILE = path.join(DATA_DIR, 'billing.json');

// Ensure Config File Exists
function getClinicConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch (err) {
    console.warn('Could not read config.json:', err.message);
  }
  return {
    SEMAPHORE_API_KEY: process.env.SEMAPHORE_API_KEY || "",
    SEMAPHORE_SENDER_NAME: process.env.SEMAPHORE_SENDER_NAME || "OCLEAR",
    RESEND_API_KEY: process.env.RESEND_API_KEY || "",
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || "O'Clear Dental <onboarding@resend.dev>",
    CLINIC_PHONE: "0927-136-0441",
    CLINIC_ADDRESS: "Arayat, Pampanga · Philippines"
  };
}

// Initial seed data if files don't exist
const initialServices = [
  { id: 'srv-01', code: '01 / 06', name: 'Orthodontics & Tooth Alignment', category: 'Orthodontics', desc: 'Personalized orthodontic alignment and brackets tailored to straighten crowded or misaligned teeth.', duration: '60 mins', fee: 'Consultation required', active: true },
  { id: 'srv-02', code: '02 / 06', name: 'Clear Aligners', category: 'Orthodontics', desc: 'Discreet, transparent trays custom-planned using digital smile scanning to gently straighten teeth.', duration: '45 mins', fee: 'Custom Plan', active: true },
  { id: 'srv-03', code: '03 / 06', name: 'General Dentistry & Cleaning', category: 'General', desc: 'Essential ultrasonic oral prophylaxis, cavity fillings, and preventive maintenance.', duration: '45 mins', fee: '₱1,500 - ₱2,500', active: true },
  { id: 'srv-04', code: '04 / 06', name: 'In-Chair Teeth Whitening', category: 'Aesthetic', desc: 'Safe, enamel-gentle medical teeth whitening designed to brighten your smile.', duration: '60 mins', fee: '₱6,000 - ₱10,000', active: true },
  { id: 'srv-05', code: '05 / 06', name: 'Porcelain Veneers & Makeovers', category: 'Aesthetic', desc: 'Ultrathin ceramic facings handcrafted to correct discoloration, gaps, and chips.', duration: '90 mins', fee: 'Per tooth assessment', active: true },
  { id: 'srv-06', code: '06 / 06', name: 'Restorations & Tooth Preservation', category: 'General', desc: 'Gentle root canal therapy, tooth restorations, and dental crowns engineered to relieve pain.', duration: '60 mins', fee: 'Assessment required', active: true }
];

const initialPatients = [
  { id: 'pat-101', name: 'Maria Santos', age: 26, phone: '0917-555-1234', email: 'maria.santos@example.com', connected_to: 'Viber', hmo: 'Maxicare', ongoing_treatment: 'Clear Aligners (Tray 4/12)', status: 'In Treatment', last_visit: '2026-09-15', next_visit: '2026-10-15', notes: 'Patient prefers Saturday morning appointments.' },
  { id: 'pat-102', name: 'Jose Dela Cruz', age: 34, phone: '0928-888-4321', email: 'jose.delacruz@example.com', connected_to: 'WhatsApp', hmo: 'None / Self-pay', ongoing_treatment: 'Orthodontic Brackets Adjustment', status: 'In Treatment', last_visit: '2026-09-20', next_visit: '2026-10-18', notes: 'Lower arch adjustment completed.' },
  { id: 'pat-103', name: 'Angela Reyes', age: 29, phone: '0939-222-9876', email: 'angela.reyes@example.com', connected_to: 'Regular Mobile / SMS', hmo: 'Medicard', ongoing_treatment: 'Composite Filling & Cleaning', status: 'Active', last_visit: '2026-09-22', next_visit: '2026-11-20', notes: 'Oral prophylaxis completed.' },
  { id: 'pat-104', name: 'Jonathan Gomez', age: 41, phone: '0915-777-6543', email: 'jonathan.g@example.com', connected_to: 'Telegram', hmo: 'Intellicare', ongoing_treatment: 'Teeth Whitening Consultation', status: 'New', last_visit: '2026-09-26', next_visit: '2026-10-02', notes: 'Interested in in-chair whitening.' }
];

const initialAppointments = [
  { id: 'apt-001', name: 'Maria Santos', age: 26, email: 'maria.santos@example.com', phone: '0917-555-1234', connected_to: 'Viber', procedure: 'Clear Aligners', date: '2026-09-28', time: '09:00 AM', branch: 'O’Clear Dental Clinic — Main Clinic (Arayat, Pampanga)', hmo: 'Maxicare', status: 'Confirmed', created_at: new Date().toISOString() },
  { id: 'apt-002', name: 'Jose Dela Cruz', age: 34, email: 'jose.delacruz@example.com', phone: '0928-888-4321', connected_to: 'WhatsApp', procedure: 'Orthodontics & Tooth Alignment', date: '2026-09-28', time: '11:30 AM', branch: 'O’Clear Dental Clinic — Main Clinic (Arayat, Pampanga)', hmo: 'None / Self-pay', status: 'Pending', created_at: new Date().toISOString() },
  { id: 'apt-003', name: 'Angela Reyes', age: 29, email: 'angela.reyes@example.com', phone: '0939-222-9876', connected_to: 'Regular Mobile / SMS', procedure: 'Restorations / Cavity Filling', date: '2026-09-28', time: '02:00 PM', branch: 'O’Clear Dental Clinic — Main Clinic (Arayat, Pampanga)', hmo: 'Medicard', status: 'Confirmed', created_at: new Date().toISOString() }
];

const initialInventory = [
  { id: 'inv-01', item: 'Disposable Surgical Masks', category: 'PPE', qty: 12, minQty: 50, unit: 'pieces', status: 'Low' },
  { id: 'inv-02', item: 'Latex Gloves · Medium', category: 'PPE', qty: 2, minQty: 10, unit: 'boxes', status: 'Low' },
  { id: 'inv-03', item: 'Dental Composite Syringe (A2)', category: 'Materials', qty: 1, minQty: 5, unit: 'syringes', status: 'Low' },
  { id: 'inv-04', item: 'Sterilization Autoclave Pouches', category: 'Sterilization', qty: 180, minQty: 50, unit: 'pouches', status: 'Good' },
  { id: 'inv-05', item: 'Prophy Paste (Mint)', category: 'Preventive', qty: 8, minQty: 3, unit: 'tubs', status: 'Good' }
];

const initialBilling = [
  { id: "INV-2026-001", patient_name: "Maria Santos", phone: "0917-555-1234", procedure: "Clear Aligners (Initial Downpayment)", date: "2026-09-28", total_amount: 25000, discount: 0, hmo_coverage: 0, amount_paid: 25000, balance: 0, payment_method: "GCash", status: "Paid", notes: "Official receipt issued.", created_at: "2026-09-28T09:30:00Z" },
  { id: "INV-2026-002", patient_name: "Angela Reyes", phone: "0939-222-9876", procedure: "Composite Restoration & Cleaning", date: "2026-09-28", total_amount: 3500, discount: 0, hmo_coverage: 2500, amount_paid: 1000, balance: 0, payment_method: "HMO (Medicard) + Cash", status: "Paid", notes: "Medicard LOA approved.", created_at: "2026-09-28T14:15:00Z" },
  { id: "INV-2026-003", patient_name: "Jose Dela Cruz", phone: "0928-888-4321", procedure: "Orthodontic Bracket Adjustment", date: "2026-09-28", total_amount: 1500, discount: 0, hmo_coverage: 0, amount_paid: 1500, balance: 0, payment_method: "Cash", status: "Paid", notes: "Routine monthly adjustment.", created_at: "2026-09-28T11:45:00Z" }
];

function initJsonFile(filePath, initialData) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

initJsonFile(APPOINTMENTS_FILE, initialAppointments);
initJsonFile(PATIENTS_FILE, initialPatients);
initJsonFile(SERVICES_FILE, initialServices);
initJsonFile(INVENTORY_FILE, initialInventory);
initJsonFile(BILLING_FILE, initialBilling);

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    return [];
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// -------------------------------------------------------------
// NOTIFICATION ENGINES (SEMAPHORE.CO SMS & RESEND.COM EMAIL)
// -------------------------------------------------------------

function sendSemaphoreSms(phone, message) {
  const config = getClinicConfig();
  if (!config.SEMAPHORE_API_KEY) {
    console.log(`\n[SMS MOCK — SEMAPHORE] (Add your SEMAPHORE_API_KEY in config.json to send live SMS)`);
    console.log(`✦ Recipient: ${phone}`);
    console.log(`✦ Message: "${message}"\n`);
    return Promise.resolve({ success: true, mock: true, message: 'Mock SMS logged' });
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const postData = new URLSearchParams({
    apikey: config.SEMAPHORE_API_KEY,
    number: cleanPhone,
    message: message,
    sendername: config.SEMAPHORE_SENDER_NAME || ''
  }).toString();

  return new Promise((resolve) => {
    const req = https.request('https://api.semaphore.co/api/v4/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`[SMS SEMAPHORE SUCCESS] Response ${res.statusCode}: ${body}`);
        resolve({ success: res.statusCode >= 200 && res.statusCode < 300, response: body });
      });
    });

    req.on('error', (err) => {
      console.error('[SMS ERROR]', err.message);
      resolve({ success: false, error: err.message });
    });

    req.write(postData);
    req.end();
  });
}

function sendResendEmail(toEmail, subject, htmlContent) {
  const config = getClinicConfig();
  if (!config.RESEND_API_KEY || !toEmail) {
    console.log(`\n[EMAIL MOCK — RESEND] (Add your RESEND_API_KEY in config.json to send live emails)`);
    console.log(`✦ Recipient: ${toEmail}`);
    console.log(`✦ Subject: "${subject}"\n`);
    return Promise.resolve({ success: true, mock: true, message: 'Mock email logged' });
  }

  const postData = JSON.stringify({
    from: config.RESEND_FROM_EMAIL || "O'Clear Dental <onboarding@resend.dev>",
    to: [toEmail],
    subject: subject,
    html: htmlContent
  });

  return new Promise((resolve) => {
    const req = https.request('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`[EMAIL RESEND SUCCESS] Response ${res.statusCode}: ${body}`);
        resolve({ success: res.statusCode >= 200 && res.statusCode < 300, response: body });
      });
    });

    req.on('error', (err) => {
      console.error('[EMAIL ERROR]', err.message);
      resolve({ success: false, error: err.message });
    });

    req.write(postData);
    req.end();
  });
}

function createPayMongoPaymentLink(invoice, customer) {
  const config = getClinicConfig();
  const amountToCharge = Number(invoice.balance > 0 ? invoice.balance : invoice.total_amount) || 0;
  const amountCentavos = Math.round(amountToCharge * 100);

  if (config.PAYMONGO_SECRET_KEY) {
    const postData = JSON.stringify({
      data: {
        attributes: {
          amount: amountCentavos,
          description: `Dental Care: ${invoice.procedure} (Invoice #${invoice.id})`,
          remarks: `O'Clear Dental Clinic - ${invoice.patient_name}`
        }
      }
    });

    return new Promise((resolve) => {
      const auth = Buffer.from(config.PAYMONGO_SECRET_KEY + ':').toString('base64');
      const req = https.request('https://api.paymongo.com/v1/links', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed.data && parsed.data.attributes && parsed.data.attributes.checkout_url) {
              resolve({
                success: true,
                checkoutUrl: parsed.data.attributes.checkout_url,
                referenceNumber: parsed.data.attributes.reference_number,
                isMock: false
              });
            } else {
              resolve({ success: false, error: parsed.errors || 'PayMongo API Error' });
            }
          } catch (e) {
            resolve({ success: false, error: e.message });
          }
        });
      });
      req.on('error', err => resolve({ success: false, error: err.message }));
      req.write(postData);
      req.end();
    });
  }

  // Fallback Simulation / Sandbox
  const mockUrl = `/paymongo-checkout.html?inv=${encodeURIComponent(invoice.id)}&amount=${amountToCharge}&name=${encodeURIComponent(invoice.patient_name)}&procedure=${encodeURIComponent(invoice.procedure)}`;
  return Promise.resolve({
    success: true,
    checkoutUrl: mockUrl,
    referenceNumber: 'PM-REF-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
    isMock: true
  });
}

// Anti-DDoS Rate Limiting Map
const rateLimitMap = new Map();
const COOLDOWN_MS = 3000;

// MIME Types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // -------------------------------------------------------------
  // REST API ENDPOINTS
  // -------------------------------------------------------------

  // 1. GET /api/stats (Overview metrics)
  if (req.method === 'GET' && pathname === '/api/stats') {
    const appointments = readJson(APPOINTMENTS_FILE);
    const patients = readJson(PATIENTS_FILE);
    const inventory = readJson(INVENTORY_FILE);
    const billing = readJson(BILLING_FILE);

    const pendingCount = appointments.filter(a => a.status === 'Pending').length;
    const confirmedCount = appointments.filter(a => a.status === 'Confirmed').length;
    const lowStockCount = inventory.filter(i => i.qty <= i.minQty).length;

    // Calculate Sales
    const totalSales = billing.reduce((sum, b) => sum + (Number(b.amount_paid) || 0), 0);
    const pendingBalance = billing.reduce((sum, b) => sum + (Number(b.balance) || 0), 0);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      totalAppointments: appointments.length,
      pendingAppointments: pendingCount,
      confirmedAppointments: confirmedCount,
      totalPatients: patients.length,
      lowStockItems: lowStockCount,
      activeServices: readJson(SERVICES_FILE).length,
      totalSales: totalSales,
      pendingBalance: pendingBalance
    }));
    return;
  }

  // 2. GET /api/appointments
  if (req.method === 'GET' && pathname === '/api/appointments') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(readJson(APPOINTMENTS_FILE)));
    return;
  }

  // 3. POST /api/appointments (Submission from public website form)
  if (req.method === 'POST' && pathname === '/api/appointments') {
    const clientIp = req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const lastRequest = rateLimitMap.get(clientIp) || 0;

    if (now - lastRequest < COOLDOWN_MS) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Too many requests. Please wait a moment before submitting again.' }));
      return;
    }
    rateLimitMap.set(clientIp, now);

    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        let data = {};
        if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
          data = JSON.parse(body);
        } else {
          const params = new URLSearchParams(body);
          for (const [key, val] of params.entries()) {
            data[key] = val;
          }
        }

        if (data._clinic_hp_check && data._clinic_hp_check.trim() !== '') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Received' }));
          return;
        }

        if (!data.name || !data.phone || !data.procedure || !data.date) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing required appointment fields.' }));
          return;
        }

        const appointments = readJson(APPOINTMENTS_FILE);
        const newAppointment = {
          id: 'apt-' + crypto.randomBytes(4).toString('hex'),
          name: String(data.name).trim().slice(0, 256),
          age: data.age ? Number(data.age) : null,
          email: String(data.email || '').trim().slice(0, 256),
          phone: String(data.phone).trim().slice(0, 50),
          connected_to: data.connected_to || 'Regular Mobile / SMS',
          procedure: data.procedure,
          date: data.date,
          time: data.time || 'Preferred Schedule',
          branch: data.branch || 'O’Clear Dental Clinic — Main Clinic (Arayat, Pampanga)',
          hmo: data.hmo || 'None / Self-pay',
          fileName: data.fileName || null,
          status: 'Pending',
          created_at: new Date().toISOString()
        };

        appointments.unshift(newAppointment);
        writeJson(APPOINTMENTS_FILE, appointments);

        // Auto-sync into Patient Catalog
        const patients = readJson(PATIENTS_FILE);
        const existingPatient = patients.find(p => p.phone === newAppointment.phone || (newAppointment.email && p.email === newAppointment.email));

        if (!existingPatient) {
          const newPatient = {
            id: 'pat-' + crypto.randomBytes(4).toString('hex'),
            name: newAppointment.name,
            age: newAppointment.age,
            phone: newAppointment.phone,
            email: newAppointment.email,
            connected_to: newAppointment.connected_to,
            hmo: newAppointment.hmo,
            ongoing_treatment: newAppointment.procedure + ' (New Inquiry)',
            status: 'New',
            last_visit: newAppointment.date,
            next_visit: newAppointment.date,
            notes: 'Registered via online Appointment Request Form.'
          };
          patients.unshift(newPatient);
          writeJson(PATIENTS_FILE, patients);
        }

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, appointment: newAppointment }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request data' }));
      }
    });
    return;
  }

  // 4. PATCH /api/appointments/:id (Update status & Trigger Semaphore SMS / Resend Email)
  if (req.method === 'PATCH' && pathname.startsWith('/api/appointments/')) {
    const id = pathname.replace('/api/appointments/', '');
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const update = JSON.parse(body);
        const appointments = readJson(APPOINTMENTS_FILE);
        const apt = appointments.find(a => a.id === id);
        if (!apt) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Appointment not found' }));
          return;
        }

        const prevStatus = apt.status;
        if (update.status) apt.status = update.status;
        if (update.notes) apt.notes = update.notes;
        writeJson(APPOINTMENTS_FILE, appointments);

        // TRIGGER AUTOMATED NOTIFICATIONS WHEN STAFF CONFIRMS
        if (update.status === 'Confirmed' && prevStatus !== 'Confirmed') {
          // 1. Auto SMS via Semaphore
          const smsText = `O'Clear Dental Clinic: Hello ${apt.name}! Your appointment for ${apt.procedure} on ${apt.date} (${apt.time || 'Clinic Hours'}) at our Arayat, Pampanga clinic is now CONFIRMED by Dr. Claire. Clinic Line: 0927-136-0441.`;
          sendSemaphoreSms(apt.phone, smsText);

          // 2. Auto Email via Resend
          if (apt.email) {
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #dbe7f2; border-radius: 12px; background: #ffffff;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h1 style="color: #08094b; margin: 0; font-size: 24px; letter-spacing: 0.05em;">O’CLEAR DENTAL CLINIC</h1>
                  <p style="color: #6c7e90; font-size: 13px; margin: 4px 0 0;">Your smile, made clear. · Arayat, Pampanga</p>
                </div>
                <div style="background: #eef8ff; border: 1.5px solid #08094b; padding: 18px 22px; border-radius: 8px; margin-bottom: 24px;">
                  <h2 style="color: #08094b; margin: 0 0 8px; font-size: 18px;">Appointment Confirmed! ✓</h2>
                  <p style="margin: 0; color: #141833; font-size: 14px; line-height: 1.6;">
                    Dear <strong>${apt.name}</strong>,<br />
                    We are pleased to inform you that your dental consultation with <strong>Dr. Claire Ann T. Cordova</strong> has been officially confirmed by our staff.
                  </p>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
                  <tr style="border-bottom: 1px solid #edf2f5;">
                    <td style="padding: 10px 0; color: #6c7e90; width: 35%;">Service:</td>
                    <td style="padding: 10px 0; font-weight: bold; color: #08094b;">${apt.procedure}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #edf2f5;">
                    <td style="padding: 10px 0; color: #6c7e90;">Date & Time:</td>
                    <td style="padding: 10px 0; font-weight: bold; color: #08094b;">${apt.date} (${apt.time || 'Preferred Schedule'})</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #edf2f5;">
                    <td style="padding: 10px 0; color: #6c7e90;">Clinic Location:</td>
                    <td style="padding: 10px 0; font-weight: bold; color: #08094b;">O’Clear Dental Clinic, Arayat, Pampanga · Philippines</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #edf2f5;">
                    <td style="padding: 10px 0; color: #6c7e90;">Direct Line:</td>
                    <td style="padding: 10px 0; font-weight: bold; color: #08094b;">0927-136-0441</td>
                  </tr>
                </table>
                <div style="background: #f8fbfe; padding: 16px; border-radius: 8px; font-size: 13px; color: #556575; line-height: 1.6; margin-bottom: 24px; border-left: 3px solid #08094b;">
                  ✦ <strong>Patient Reminder:</strong> Please arrive 10–15 minutes early. If you need to make changes or have questions prior to your visit, please contact us at 0927-136-0441.
                </div>
                <p style="font-size: 12px; color: #8896a6; text-align: center; margin: 0;">
                  © 2026 O’Clear Dental Clinic. All rights reserved.
                </p>
              </div>
            `;
            sendResendEmail(apt.email, `Appointment Confirmed: ${apt.procedure} — O’Clear Dental Clinic`, emailHtml);
          }
        }

        // Auto-sync Completed appointment with Patient Catalog
        if (update.status === 'Completed') {
          const patients = readJson(PATIENTS_FILE);
          const p = patients.find(pat => pat.phone === apt.phone || pat.name.toLowerCase() === apt.name.toLowerCase());
          if (p) {
            p.last_visit = apt.date;
            p.status = 'Completed';
            writeJson(PATIENTS_FILE, patients);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, appointment: apt, notificationTriggered: update.status === 'Confirmed' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // 5. GET /api/billing (Sales & Invoices)
  if (req.method === 'GET' && pathname === '/api/billing') {
    const billing = readJson(BILLING_FILE);
    const totalSales = billing.reduce((sum, b) => sum + (Number(b.amount_paid) || 0), 0);
    const totalBalance = billing.reduce((sum, b) => sum + (Number(b.balance) || 0), 0);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      invoices: billing,
      totalSales: totalSales,
      totalBalance: totalBalance,
      invoiceCount: billing.length
    }));
    return;
  }

  // 6. POST /api/billing (Create new invoice with Automated Markup & Sales record)
  if (req.method === 'POST' && pathname === '/api/billing') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (!data.patient_name || !data.total_amount) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Patient name and total amount are required.' }));
          return;
        }

        const billing = readJson(BILLING_FILE);
        const baseCost = Number(data.base_cost) || 0;
        const markupPercent = Number(data.markup_percent) || 0;
        const markupAmount = Number(data.markup_amount) || 0;
        const gatewayFee = Number(data.gateway_fee) || 0;
        const total = Number(data.total_amount) || 0;
        const discount = Number(data.discount) || 0;
        const hmo = Number(data.hmo_coverage) || 0;
        const paid = Number(data.amount_paid) || 0;
        const balance = Math.max(0, total - discount - hmo - paid);

        const newInvoice = {
          id: 'INV-' + new Date().getFullYear() + '-' + String(billing.length + 1).padStart(3, '0'),
          patient_name: String(data.patient_name).trim(),
          phone: String(data.phone || '').trim(),
          procedure: data.procedure || 'Dental Treatment',
          date: data.date || new Date().toISOString().split('T')[0],
          base_cost: baseCost,
          markup_percent: markupPercent,
          markup_amount: markupAmount,
          gateway_fee: gatewayFee,
          total_amount: total,
          discount: discount,
          hmo_coverage: hmo,
          amount_paid: paid,
          balance: balance,
          payment_method: data.payment_method || 'Cash',
          status: balance <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid'),
          notes: data.notes || '',
          created_at: new Date().toISOString()
        };

        billing.unshift(newInvoice);
        writeJson(BILLING_FILE, billing);

        // Auto-sync invoice with Patient Catalog
        const patients = readJson(PATIENTS_FILE);
        const patientMatch = patients.find(p => 
          (newInvoice.phone && p.phone === newInvoice.phone) || 
          p.name.toLowerCase() === newInvoice.patient_name.toLowerCase()
        );

        if (patientMatch) {
          patientMatch.last_visit = newInvoice.date;
          patientMatch.ongoing_treatment = newInvoice.procedure;
          if (patientMatch.status === 'New') patientMatch.status = 'Active';
          writeJson(PATIENTS_FILE, patients);
        } else {
          const newPatientRecord = {
            id: 'pat-' + crypto.randomBytes(4).toString('hex'),
            name: newInvoice.patient_name,
            phone: newInvoice.phone || '',
            age: null,
            email: '',
            connected_to: 'Regular Mobile / SMS',
            hmo: 'None / Self-pay',
            ongoing_treatment: newInvoice.procedure,
            status: 'Active',
            last_visit: newInvoice.date,
            next_visit: '',
            notes: `Auto-created from official invoice ${newInvoice.id}`
          };
          patients.unshift(newPatientRecord);
          writeJson(PATIENTS_FILE, patients);
        }

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, invoice: newInvoice }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // 6b. POST /api/paymongo/create-link (Generate PayMongo payment link)
  if (req.method === 'POST' && pathname === '/api/paymongo/create-link') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { invoiceId, sendSms, sendEmail } = JSON.parse(body);
        const billing = readJson(BILLING_FILE);
        const inv = billing.find(b => b.id === invoiceId);
        if (!inv) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invoice not found' }));
          return;
        }

        const patients = readJson(PATIENTS_FILE);
        const patient = patients.find(p => p.name === inv.patient_name || p.phone === inv.phone);

        const pmResult = await createPayMongoPaymentLink(inv, patient);
        inv.payment_link = pmResult.checkoutUrl;
        writeJson(BILLING_FILE, billing);

        // Auto-send payment link via Semaphore SMS
        if (sendSms && inv.phone) {
          const smsMsg = `O'Clear Dental Clinic: Hello ${inv.patient_name}, here is your secure PayMongo payment link (GCash/Card) for ${inv.procedure} (Amount: ₱${inv.balance || inv.total_amount}): ${pmResult.checkoutUrl}`;
          sendSemaphoreSms(inv.phone, smsMsg);
        }

        // Auto-send payment link via Resend Email
        if (sendEmail && patient && patient.email) {
          const emailSubject = `Secure PayMongo Link: ${inv.procedure} — O'Clear Dental Clinic`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #dbe7f2; border-radius: 10px; background: #ffffff;">
              <h2 style="color: #08094b; margin: 0 0 8px;">O'Clear Dental Clinic</h2>
              <p style="color: #556575; font-size: 13px;">Your smile, made clear. · Arayat, Pampanga</p>
              <p>Hi <strong>${inv.patient_name}</strong>,</p>
              <p>Here is your secure PayMongo checkout link for <strong>${inv.procedure}</strong>.</p>
              <div style="background: #eef8ff; border: 1px solid #08094b; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <div style="font-size: 13px; color: #556575;">Total Payable Amount:</div>
                <div style="font-size: 26px; font-weight: bold; color: #08094b;">₱${(inv.balance || inv.total_amount).toLocaleString()}</div>
              </div>
              <a href="${pmResult.checkoutUrl}" style="display: block; text-align: center; background: #00b050; color: #fff; padding: 14px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px;">
                Pay with PayMongo (GCash / Card / Maya) ⚡
              </a>
            </div>
          `;
          sendResendEmail(patient.email, emailSubject, emailHtml);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(pmResult));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 6c. POST /api/paymongo/mark-paid (PayMongo webhook / simulation payment confirmation)
  if (req.method === 'POST' && pathname === '/api/paymongo/mark-paid') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { invoiceId, paymentMethod, amountPaid } = JSON.parse(body);
        const billing = readJson(BILLING_FILE);
        const inv = billing.find(b => b.id === invoiceId);
        if (!inv) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invoice not found' }));
          return;
        }

        inv.status = 'Paid';
        inv.amount_paid = Number(amountPaid) || inv.total_amount;
        inv.balance = 0;
        inv.payment_method = paymentMethod || 'PayMongo (Online)';
        writeJson(BILLING_FILE, billing);

        console.log(`[PAYMONGO SUCCESS] Invoice ${inv.id} paid in full (₱${inv.amount_paid}) via ${inv.payment_method}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, invoice: inv }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 7. GET /api/patients
  if (req.method === 'GET' && pathname === '/api/patients') {
    const search = (parsedUrl.searchParams.get('search') || '').toLowerCase();
    let patients = readJson(PATIENTS_FILE);
    if (search) {
      patients = patients.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.phone.toLowerCase().includes(search) ||
        (p.email && p.email.toLowerCase().includes(search))
      );
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(patients));
    return;
  }

  // 8. POST /api/patients
  if (req.method === 'POST' && pathname === '/api/patients') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (!data.name || !data.phone) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Patient name and phone are required.' }));
          return;
        }
        const patients = readJson(PATIENTS_FILE);
        const newPatient = {
          id: 'pat-' + crypto.randomBytes(4).toString('hex'),
          name: String(data.name).trim(),
          age: data.age ? Number(data.age) : null,
          phone: String(data.phone).trim(),
          email: String(data.email || '').trim(),
          connected_to: data.connected_to || 'Regular Mobile / SMS',
          hmo: data.hmo || 'None / Self-pay',
          ongoing_treatment: data.ongoing_treatment || 'General Checkup',
          status: data.status || 'Active',
          last_visit: data.last_visit || new Date().toISOString().split('T')[0],
          next_visit: data.next_visit || '',
          notes: data.notes || ''
        };
        patients.unshift(newPatient);
        writeJson(PATIENTS_FILE, patients);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, patient: newPatient }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // 8b. PATCH /api/patients/:id (Update patient details, treatment progress, or milestones)
  if (req.method === 'PATCH' && pathname.startsWith('/api/patients/')) {
    const patId = pathname.replace('/api/patients/', '');
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const update = JSON.parse(body);
        const patients = readJson(PATIENTS_FILE);
        const patient = patients.find(p => p.id === patId);
        if (!patient) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Patient not found' }));
          return;
        }

        Object.assign(patient, update);
        writeJson(PATIENTS_FILE, patients);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, patient }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // 9. GET /api/services
  if (req.method === 'GET' && pathname === '/api/services') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(readJson(SERVICES_FILE)));
    return;
  }

  // 10. POST /api/services
  if (req.method === 'POST' && pathname === '/api/services') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (!data.name) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Service name is required' }));
          return;
        }
        const services = readJson(SERVICES_FILE);
        const priceNum = Number(data.price) || 0;
        const newService = {
          id: 'srv-' + crypto.randomBytes(3).toString('hex'),
          code: `0${services.length + 1} / 0${services.length + 1}`,
          name: data.name,
          category: data.category || 'General',
          price: priceNum,
          fee: data.fee || ('₱' + priceNum.toLocaleString()),
          desc: data.desc || '',
          duration: data.duration || '45 mins',
          active: true
        };
        services.push(newService);
        writeJson(SERVICES_FILE, services);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, service: newService }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // 10b. PATCH /api/services/:id (Update service price & details)
  if (req.method === 'PATCH' && pathname.startsWith('/api/services/')) {
    const srvId = pathname.replace('/api/services/', '');
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const update = JSON.parse(body);
        const services = readJson(SERVICES_FILE);
        const srv = services.find(s => s.id === srvId);
        if (!srv) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Service not found' }));
          return;
        }

        if (update.price !== undefined) {
          srv.price = Number(update.price) || 0;
          srv.fee = '₱' + srv.price.toLocaleString();
        }
        if (update.fee) srv.fee = update.fee;
        if (update.name) srv.name = update.name;
        if (update.category) srv.category = update.category;
        if (update.desc !== undefined) srv.desc = update.desc;
        if (update.duration !== undefined) srv.duration = update.duration;
        if (update.active !== undefined) srv.active = update.active;

        writeJson(SERVICES_FILE, services);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, service: srv }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // 10c. GET /api/inventory (Inventory list with stocks & activity logs)
  if (req.method === 'GET' && pathname === '/api/inventory') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(readJson(INVENTORY_FILE)));
    return;
  }

  // 10d. POST /api/inventory/action (Tag: Kumuha ng stock / Nagdagdag ng stock)
  if (req.method === 'POST' && pathname === '/api/inventory/action') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { itemId, action, qty, staff, reason } = JSON.parse(body);
        const inventory = readJson(INVENTORY_FILE);
        const item = inventory.find(i => i.id === itemId);

        if (!item) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Inventory item not found' }));
          return;
        }

        const count = Math.max(1, Number(qty) || 1);
        const now = new Date();
        const timeStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
                        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        if (action === 'kumuha') {
          if (item.qty < count) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Kulang na ang stock. ${item.qty} ${item.unit} nalang ang natitira.` }));
            return;
          }
          item.qty -= count;
          item.last_taken = {
            staff: staff || 'Staff',
            qty: count,
            date: timeStr,
            reason: reason || 'Clinic procedure use'
          };
          if (!item.history) item.history = [];
          item.history.unshift({
            action: 'kumuha',
            qty: count,
            staff: staff || 'Staff',
            remaining: item.qty,
            date: timeStr,
            reason: reason || 'Clinic use'
          });
        } else if (action === 'dagdag') {
          item.qty += count;
          if (!item.history) item.history = [];
          item.history.unshift({
            action: 'dagdag',
            qty: count,
            staff: staff || 'Staff',
            remaining: item.qty,
            date: timeStr,
            reason: reason || 'Restock delivery'
          });
        }

        // Update status tag
        item.status = item.qty <= 0 ? 'Out of Stock' : (item.qty <= item.minQty ? 'Low' : 'Good');
        writeJson(INVENTORY_FILE, inventory);

        console.log(`[INVENTORY TAG] Item: ${item.item} | Action: ${action} (${count} ${item.unit}) by ${staff || 'Staff'} | Natira (Ilan nalang): ${item.qty}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, item: item }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 11. GET /api/config (Safe config retrieval)
  if (req.method === 'GET' && pathname === '/api/config') {
    const config = getClinicConfig();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      hasSemaphoreKey: Boolean(config.SEMAPHORE_API_KEY),
      semaphoreSender: config.SEMAPHORE_SENDER_NAME,
      hasResendKey: Boolean(config.RESEND_API_KEY),
      resendFrom: config.RESEND_FROM_EMAIL,
      hasPayMongoKey: Boolean(config.PAYMONGO_SECRET_KEY)
    }));
    return;
  }

  // -------------------------------------------------------------
  // STATIC ASSET SERVING
  // -------------------------------------------------------------
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h1>404 Not Found</h1><p>The path <code>${pathname}</code> was not found on this server.</p>`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`✦ O'CLEAR DENTAL CLINIC — SERVER & NOTIFICATIONS ACTIVE`);
  console.log(`✦ URL: http://localhost:${PORT}`);
  console.log(`✦ SMS: Semaphore.co integration ready`);
  console.log(`✦ Email: Resend.com integration ready`);
  console.log(`✦ Billing & Sales: /api/billing ready`);
  console.log(`=======================================================`);
});

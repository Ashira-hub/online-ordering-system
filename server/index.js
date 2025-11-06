const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const notificationapi = require('notificationapi-node-server-sdk').default;

const app = express();
app.use(cors());
app.use(express.json());

const {
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET,
  PAYPAL_MODE = 'sandbox', // 'sandbox' or 'live'
  PORT = 4000,
  NOTIFICATION_API_CLIENT_ID,
  NOTIFICATION_API_CLIENT_SECRET,
  NOTIFICATION_DEFAULT_TO
} = process.env;

// Detect built client assets (for single-service deploys)
const clientBuildPath = path.join(__dirname, '..', 'build');
const HAS_CLIENT_BUILD = fs.existsSync(clientBuildPath);

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.warn('[paypal] Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET in environment.');
}

// Store minimal order metadata between create and capture (in-memory)
const orderMeta = new Map(); // key: orderId, value: { items, description, currency, value }

async function captureOrder(accessToken, orderId) {
  const url = `${BASE_URL}/v2/checkout/orders/${orderId}/capture`;
  // Attempt 1: JSON body with headers
  let res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Prefer': 'return=representation'
    },
    body: '{}'
  });
  if (res.status !== 415) return res;
  // Attempt 2: No body, minimal headers
  res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Prefer': 'return=representation'
    }
  });
  if (res.status !== 415) return res;
  // Attempt 3: No body, with JSON headers
  res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Prefer': 'return=representation'
    }
  });
  return res;
}

// Initialize NotificationAPI if credentials are present
let notificationsReady = false;
try {
  if (NOTIFICATION_API_CLIENT_ID && NOTIFICATION_API_CLIENT_SECRET) {
    notificationapi.init(NOTIFICATION_API_CLIENT_ID, NOTIFICATION_API_CLIENT_SECRET);
    notificationsReady = true;
  } else {
    console.warn('[notificationapi] Missing NOTIFICATION_API_CLIENT_ID/NOTIFICATION_API_CLIENT_SECRET. Skipping email notifications.');
  }
} catch (e) {
  console.warn('[notificationapi] Failed to initialize:', e?.message);
}

async function sendPaymentEmail({ toEmail, subject, html }) {
  if (!notificationsReady) return;
  try {
    await notificationapi.send({
      type: 'send',
      to: { id: toEmail, email: toEmail },
      email: { subject, html }
    });
  } catch (e) {
    console.warn('[notificationapi] send failed:', e?.message);
  }
}

async function sendLoginEmail({ toEmail }) {
  if (!notificationsReady || !toEmail) return;
  const subject = 'Welcome back!';
  const html = 'You have successfully logged in to Online Ordering. If this wasn\'t you, please secure your account.';
  try {
    await notificationapi.send({
      type: 'send',
      to: { id: toEmail, email: toEmail },
      email: { subject, html }
    });
  } catch (e) {
    console.warn('[notificationapi] login email failed:', e?.message);
  }
}

// Login notification endpoint
app.post('/api/notify/login', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!notificationsReady) return res.status(503).json({ error: 'Notification service not configured' });
    if (!email) return res.status(400).json({ error: 'email is required' });
    await sendLoginEmail({ toEmail: email });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to send login notification' });
  }
});

const BASE_URL = PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get access token: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

app.post('/api/paypal/create-order', async (req, res) => {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Server missing PayPal credentials. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.' });
    }
    const { currency = 'USD', value = '0.01', description = 'Order', returnUrl, cancelUrl, items, brandName, locale, shippingPreference } = req.body || {};
    const accessToken = await getAccessToken();

    const orderRes = await fetch(`${BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            description,
            amount: { currency_code: currency, value }
          }
        ],
        application_context: {
          return_url: returnUrl || 'http://localhost:3000/?paypalReturn=1',
          cancel_url: cancelUrl || 'http://localhost:3000/?paypalCancel=1',
          user_action: 'PAY_NOW',
          brand_name: brandName || 'Test Store',
          locale: locale || 'en-PH',
          shipping_preference: shippingPreference || 'NO_SHIPPING'
        }
      })
    });

    const data = await orderRes.json();
    if (!orderRes.ok) {
      return res.status(orderRes.status).json({ error: data });
    }
    const approveLink = Array.isArray(data.links)
      ? data.links.find(l => l.rel === 'approve')
      : null;
    try {
      if (data?.id) {
        orderMeta.set(data.id, { items: Array.isArray(items) ? items : [], description, currency, value });
        // Cleanup later: auto-delete after 30 minutes
        setTimeout(() => orderMeta.delete(data.id), 30 * 60 * 1000).unref?.();
      }
    } catch {}
    res.json({ id: data.id, approveUrl: approveLink?.href });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});

app.post('/api/paypal/capture-order', async (req, res) => {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Server missing PayPal credentials. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.' });
    }
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    const accessToken = await getAccessToken();
    const capRes = await captureOrder(accessToken, orderId);

    const data = await capRes.json();
  if (!capRes.ok) {
    return res.status(capRes.status).json({ error: data, status: capRes.status });
  }
  // Send notification email (non-blocking best effort)
  try {
    const unit = data?.purchase_units?.[0];
    const capture = unit?.payments?.captures?.[0];
    const amount = capture?.amount?.value;
    const currency = capture?.amount?.currency_code || 'USD';
    const txnId = capture?.id || data?.id;
    const description = unit?.description || 'Online Order';
    const payerEmail = data?.payer?.email_address || data?.payer?.payer_id || NOTIFICATION_DEFAULT_TO;
    const payerGiven = data?.payer?.name?.given_name || '';
    const payerSurname = data?.payer?.name?.surname || '';
    const payerFull = [payerGiven, payerSurname].filter(Boolean).join(' ');
    const when = new Date().toLocaleString();
    const meta = orderMeta.get(req.body.orderId) || {};
    const items = Array.isArray(meta.items) ? meta.items : [];

    const subject = `Payment received: ${currency} ${amount}`;
    const itemsHtml = items.length
      ? `<table style="width:100%;border-collapse:collapse;margin:10px 0">
          <thead>
            <tr>
              <th style="text-align:left;border-bottom:1px solid #e5e7eb;padding:6px 4px">Item</th>
              <th style="text-align:right;border-bottom:1px solid #e5e7eb;padding:6px 4px">Qty</th>
              <th style="text-align:right;border-bottom:1px solid #e5e7eb;padding:6px 4px">Price</th>
              <th style="text-align:right;border-bottom:1px solid #e5e7eb;padding:6px 4px">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(it => `<tr>
                  <td style="padding:6px 4px">${it.name}${it.store ? ` <span style='color:#6b7280'>( ${it.store} )</span>` : ''}</td>
                  <td style="padding:6px 4px;text-align:right">${it.qty}</td>
                  <td style="padding:6px 4px;text-align:right">${it.currency || currency} ${it.price}</td>
                  <td style="padding:6px 4px;text-align:right">${it.currency || currency} ${it.total}</td>
                </tr>`)
              .join('')}
          </tbody>
        </table>`
      : '';

    const html = `
      <div style="font-family:system-ui,Segoe UI,Roboto,Arial;line-height:1.5;">
        <h2 style="margin:0 0 8px">Thank you for your purchase!</h2>
        <p style="margin:0 0 6px">Hello ${payerFull || 'Customer'} (${payerEmail || 'N/A'}),</p>
        <p style="margin:0 0 10px">We have received your payment.</p>
        <ul style="padding-left:16px;margin:0 0 10px">
          <li><strong>Transaction ID:</strong> ${txnId}</li>
          <li><strong>Amount:</strong> ${currency} ${amount}</li>
          <li><strong>Description:</strong> ${description}</li>
          <li><strong>Date:</strong> ${when}</li>
        </ul>
        ${itemsHtml}
        <p style="margin:10px 0 0">If you have any questions, just reply to this email.</p>
      </div>
    `;

    // Fire-and-forget to payer and store email (if configured)
    if (payerEmail) sendPaymentEmail({ toEmail: payerEmail, subject, html });
    if (NOTIFICATION_DEFAULT_TO && NOTIFICATION_DEFAULT_TO !== payerEmail) {
      sendPaymentEmail({ toEmail: NOTIFICATION_DEFAULT_TO, subject, html });
    }
  } catch {}
  res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to capture PayPal order' });
  }
});
if (!HAS_CLIENT_BUILD) {
  app.get('/', (_req, res) => {
    res.type('html').send(`
      <html>
        <head><title>PayPal API</title></head>
        <body style="font-family: ui-sans-serif, system-ui; padding: 24px;">
          <h2>PayPal API server is running</h2>
          <p>Use the following endpoints:</p>
          <ul>
            <li>POST <code>/api/paypal/create-order</code></li>
            <li>POST <code>/api/paypal/capture-order</code></li>
            <li>GET <code>/api/health</code></li>
          </ul>
        </body>
      </html>
    `);
  });
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Products filtering API
const productsPath = path.join(__dirname, 'data', 'products.json');
app.get('/api/products', (_req, res) => {
  try {
    const url = new URL(_req.protocol + '://' + _req.get('host') + _req.originalUrl);
    const params = url.searchParams;
    const store = params.get('store');
    const q = params.get('q');
    const priceMin = parseFloat(params.get('priceMin'));
    const priceMax = parseFloat(params.get('priceMax'));
    const sort = params.get('sort'); // price_asc | price_desc | name_asc

    const raw = fs.readFileSync(productsPath, 'utf8');
    let list = JSON.parse(raw);

    if (store && store !== 'all') list = list.filter(p => p.store === store);
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(needle) ||
        p.description.toLowerCase().includes(needle) ||
        (p.store && p.store.toLowerCase().includes(needle))
      );
    }
    if (!isNaN(priceMin)) list = list.filter(p => p.price >= priceMin);
    if (!isNaN(priceMax)) list = list.filter(p => p.price <= priceMax);

    switch (sort) {
      case 'price_asc':
        list.sort((a, b) => a.price - b.price); break;
      case 'price_desc':
        list.sort((a, b) => b.price - a.price); break;
      case 'name_asc':
        list.sort((a, b) => a.name.localeCompare(b.name)); break;
    }

    res.json({ items: list });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load products' });
  }
});

// Serve client build and SPA fallback when present
if (HAS_CLIENT_BUILD) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[server] PayPal API server running on http://localhost:${PORT}`);
});

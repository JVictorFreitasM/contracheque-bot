#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');

function usage() {
  console.log('Usage: node src/testes/teste-evolution.js --url <EVOLUTION_UPLOAD_URL> --token <TOKEN> [--file <path-to-pdf>] [--raw]');
  console.log('  --raw    send raw application/pdf body instead of multipart/form-data');
  process.exit(1);
}

const argv = require('minimist')(process.argv.slice(2));
const uploadUrl = argv.url || process.env.EVOLUTION_UPLOAD_URL || process.env.WK_BASE_URL;
const token = argv.token || process.env.EVOLUTION_TOKEN;
const raw = argv.raw || false;
let filePath = argv.file || argv._[0];

if (!uploadUrl) {
  console.error('Error: missing upload URL. Provide --url or set EVOLUTION_UPLOAD_URL');
  usage();
}
if (!token) {
  console.error('Error: missing token. Provide --token or set EVOLUTION_TOKEN');
  usage();
}

if (!filePath) {
  // pick first PDF in uploads
  const uploadsDir = path.resolve(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    console.error('uploads directory not found:', uploadsDir);
    process.exit(1);
  }
  const files = fs.readdirSync(uploadsDir).filter(f => f.toLowerCase().endsWith('.pdf'));
  if (!files.length) {
    console.error('No PDF found in uploads directory:', uploadsDir);
    process.exit(1);
  }
  filePath = path.join(uploadsDir, files[0]);
}

if (!fs.existsSync(filePath)) {
  console.error('PDF not found at path:', filePath);
  process.exit(1);
}

const buffer = fs.readFileSync(filePath);
const hash = crypto.createHash('sha256').update(buffer).digest('hex');
console.log('Selected PDF:', filePath);
console.log('SHA256:', hash);

// save a debug copy for post-send comparison
const debugDir = path.resolve('debug_output_evolution');
if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
const debugCopy = path.join(debugDir, `${Date.now()}_${path.basename(filePath)}`);
fs.copyFileSync(filePath, debugCopy);
console.log('Debug copy saved to:', debugCopy);

(async () => {
  try {
    let resp;
    // Build URL with token as query parameter
    const urlWithToken = uploadUrl.includes('?') 
      ? `${uploadUrl}&token=${token}` 
      : `${uploadUrl}?token=${token}`;
    
    if (raw) {
      console.log('Sending raw application/pdf to', urlWithToken);
      resp = await axios.post(urlWithToken, buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': buffer.length
        },
        timeout: 120000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });
    } else {
      console.log('Sending multipart/form-data to', urlWithToken);
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));
      form.append('filename', path.basename(filePath));
      const headers = form.getHeaders();
      resp = await axios.post(urlWithToken, form, {
        headers,
        timeout: 120000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });
    }

    console.log('Response status:', resp.status);
    if (resp.data) {
      console.log('Response data:', typeof resp.data === 'object' ? JSON.stringify(resp.data) : resp.data);
    }

    console.log('\n--- Validation ---');
    console.log('Local debug copy SHA256:', crypto.createHash('sha256').update(fs.readFileSync(debugCopy)).digest('hex'));
    console.log('Original SHA256:', hash);
    console.log('If the server returns a file URL or checksum, compare with the original.');

  } catch (err) {
    console.error('Error during upload:', err.message || err);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response body:', err.response.data);
    }
    process.exit(1);
  }
})();

const crypto = require('crypto');

// This must match the WEBHOOK_SECRET in your .env.local
const secret = 'asdlkfjasdkAAAsssBBddfShI12039sjang'

; 
const url = 'http://localhost:3000/api/broadcast';

const payload = JSON.stringify({
  seriesKey: 'ssdi-cycle-1',
  event: 'NEW_DATE_VERIFIED'
});

const timestamp = Math.floor(Date.now() / 1000).toString();
const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-webhook-timestamp': timestamp,
    'x-webhook-signature': `v1=${signature}`
  },
  body: payload
})
.then(res => res.json())
.then(console.log)
.catch(console.error);

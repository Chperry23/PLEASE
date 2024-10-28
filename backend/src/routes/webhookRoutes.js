const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  console.log('Webhook received');
  res.status(200).end();
});

module.exports = router;

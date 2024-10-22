// AUTOLAWN/backend/src/controllers/notificationsController.js

const { Vonage } = require('@vonage/server-sdk');
const Mailgun = require('mailgun.js');
const formData = require('form-data');
const Customer = require('../models/customer');
const { parsePhoneNumberFromString } = require('libphonenumber-js');

// Initialize Vonage with the correct constructor
const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
});

// Initialize Mailgun
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
  url: 'https://api.mailgun.net', // Optional
});

exports.sendNotifications = async (req, res) => {
  const { customerIds, message, type } = req.body;

  try {
    // Fetch customers from the database
    const customers = await Customer.find({ _id: { $in: customerIds } });

    if (type === 'sms') {
      // Send SMS to each customer
      const smsPromises = customers.map(async (customer) => {
        try {
          const phoneNumber = parsePhoneNumberFromString(customer.phone, 'US'); // Adjust default country if necessary
          if (!phoneNumber || !phoneNumber.isValid()) {
            throw new Error(`Invalid phone number for customer ${customer.name}`);
          }

          const to = phoneNumber.number; // E.164 format
          const from = process.env.VONAGE_SMS_FROM; // Your Vonage virtual number or alphanumeric sender ID
          const text = message;

          // Send SMS using the Vonage client
          await vonage.sms
            .send({ to, from, text })
            .then((response) => {
              console.log(`Message sent successfully to ${customer.phone}:`, response);
            })
            .catch((error) => {
              console.error(`Error sending message to ${customer.phone}:`, error);
              throw error;
            });

          return { customerId: customer._id, status: 'sent' };
        } catch (error) {
          console.error(`Failed to send SMS to ${customer.phone}:`, error);
          return { customerId: customer._id, status: 'failed', error: error.message };
        }
      });

      const results = await Promise.all(smsPromises);
      res.status(200).json({ message: 'Notifications processed.', results });
    } else if (type === 'email') {
      // Send email to each customer
      const emailPromises = customers.map(async (customer) => {
        try {
          const data = {
            from: `Your Company <${process.env.MAILGUN_EMAIL_FROM}>`,
            to: customer.email,
            subject: 'Notification',
            text: message,
          };

          await mg.messages.create(process.env.MAILGUN_DOMAIN, data);
          return { customerId: customer._id, status: 'sent' };
        } catch (error) {
          console.error(`Failed to send email to ${customer.email}:`, error);
          return { customerId: customer._id, status: 'failed', error: error.message };
        }
      });

      const results = await Promise.all(emailPromises);
      res.status(200).json({ message: 'Notifications processed.', results });
    } else {
      res.status(400).json({ message: 'Invalid notification type.' });
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({ message: 'Failed to send notifications.' });
  }
};

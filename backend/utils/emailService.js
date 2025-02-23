const sgMail = require('@sendgrid/mail');
const Lead = require('../models/Lead');
require('dotenv').config();  // Add this line to load environment variables

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, html) => {
  try {
    const msg = {
      to,
      from: process.env.VERIFIED_SENDER,  // Using environment variable
      subject,
      html
    };

    console.log('Attempting to send email with config:', {
      to: msg.to,
      from: msg.from,
      subject: msg.subject
    });

    const response = await sgMail.send(msg);
    console.log('SendGrid Response:', response[0].statusCode);
    return true;
  } catch (error) {
    console.error('SendGrid Error:', {
      message: error.message,
      response: error.response?.body,
      code: error.code
    });
    return false;
  }
};

// Test function to add a lead and trigger immediate email
const testLeadEmail = async (email) => {
  try {
    const lead = new Lead({
      email,
      emailInterval: 1 // 1 minute for testing
    });
    await lead.save();
    console.log('Test lead created:', lead);
    
    // Trigger immediate email
    const emailSent = await sendEmail(
      email,
      'Welcome to Pool Service',
      `
      <h1>Welcome!</h1>
      <p>Thank you for your interest in our pool services.</p>
      <p>We'll be in touch with more information soon.</p>
      `
    );
    
    return { lead, emailSent };
  } catch (error) {
    console.error('Test lead email error:', error);
    throw error;
  }
};

// Function to process leads and send emails based on intervals
const processLeads = async () => {
  try {
    const now = new Date();
    const leads = await Lead.find({ status: 'active' });
    
    for (const lead of leads) {
      const lastContact = lead.lastContactedAt || lead.createdAt;
      const minutesSinceContact = Math.floor((now - lastContact) / (1000 * 60));

      if (minutesSinceContact >= lead.emailInterval) {
        const emailSent = await sendEmail(
          lead.email,
          'Pool Service Follow-up',
          `
          <h1>Hello!</h1>
          <p>Thank you for your interest in our pool services.</p>
          <p>Would you like to schedule a consultation?</p>
          <p>Best regards,<br>Pool Service Team</p>
          `
        );

        if (emailSent) {
          lead.lastContactedAt = now;
          await lead.save();
          console.log(`Email sent to ${lead.email}, next email in ${lead.emailInterval} minutes`);
        }
      }
    }
  } catch (error) {
    console.error('Process leads error:', error);
  }
};

// Run the process every minute
setInterval(processLeads, 60 * 1000);

module.exports = { sendEmail, processLeads, testLeadEmail };
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const orderId = `order_${uuidv4()}`;
require("dotenv").config();
const Razorpay = require("razorpay");

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

//This is contact form sheet
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Use Gmail as the email service
  auth: {
    user: process.env.NODEMAILER_EMAIL, // Replace with your Gmail address
    pass: process.env.NODEMAILER_PASSWORD, // Replace with your Gmail password or app-specific password
  },
});

// Function to send email to the company
const sendCompanyEmail = async (formData) => {
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 30px; background: #f8f9fb; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="color: #2c3e50; margin: 0 0 10px 0;">New Lead: ${formData.name}</h2>
        <p style="color: #7f8c8d; margin: 0;">Submitted via Contact Form</p>
      </div>

      <div style="background: white; padding: 25px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 12px; border-bottom: 1px solid #ecf0f1; color: #7f8c8d;">Name</td><td style="padding: 12px; border-bottom: 1px solid #ecf0f1;">${formData.name}</td></tr>
          <tr><td style="padding: 12px; border-bottom: 1px solid #ecf0f1; color: #7f8c8d;">Email</td><td style="padding: 12px; border-bottom: 1px solid #ecf0f1;">${formData.email}</td></tr>
          <tr><td style="padding: 12px; border-bottom: 1px solid #ecf0f1; color: #7f8c8d;">Mobile</td><td style="padding: 12px; border-bottom: 1px solid #ecf0f1;">${formData.mobile}</td></tr>
          <tr><td style="padding: 12px; color: #7f8c8d;">Message</td><td style="padding: 12px;">${formData.message}</td></tr>
        </table>
      </div>

      <div style="margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 14px;">
        <p>Avaintern Edtech Pvt Ltd<br>
        <a href="https://www.avaintern.com" style="color: #2980b9; text-decoration: none;">www.avaintern.com</a> | +91 7607811792</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.NODEMAILER_EMAIL, // Sender address
    to: process.env.COMPANY_MAIL, // Replace with the company's email
    subject: `New Contact Form Submission - ${formData.name}`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
  console.log("Company email sent successfully.");
};

// Function to send email to the user
const sendUserEmail = async (formData) => {
  const submissionId = uuidv4().slice(0, 8).toUpperCase();
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 30px; background: #f8f9fb; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="color: #2c3e50; margin: 0 0 10px 0;">Thank You, ${
          formData.name
        }!</h2>
        <p style="color: #7f8c8d; margin: 0;">We've received your message</p>
      </div>

      <div style="background: white; padding: 25px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <p style="line-height: 1.6; color: #2c3e50;">Our team will review your inquiry and respond within 24 business hours.</p>
        
        <div style="margin: 25px 0; padding: 20px; background: #f8f9fb; border-radius: 4px;">
          <p style="margin: 0; color: #7f8c8d; font-size: 14px;">
            <strong>Submission ID:</strong> ${submissionId}<br>
            <strong>Submitted at:</strong> ${new Date().toLocaleString()}
          </p>
        </div>

        <p style="line-height: 1.6; color: #2c3e50;">For urgent inquiries:<br>
        📞 +91 7607811792<br>
        📧 <a href="mailto:harsh760781@gmail.com" style="color: #2980b9; text-decoration: none;">harsh760781@gmail.com</a></p>
      </div>

      <div style="margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 14px;">
        <p>Explore our programs:<br>
        <a href="https://www.avaintern.com" style="color: #2980b9; text-decoration: none;">www.avaintern.com</a></p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: "hjds760781@gmail.com", // Sender address
    to: formData.email, // User's email from the form
    subject: "We've Received Your Message - Avaintern",
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
  console.log("User email sent successfully.");
};

app.post("/submit-form", async (req, res) => {
  console.log("Received form data:", req.body); // Log the incoming data

  try {
    // Send data to Google Apps Script
    const response = await axios.post(GOOGLE_SCRIPT_URL, req.body, {
      headers: { "Content-Type": "application/json" },
    });
    console.log("Google Apps Script response:", response.data); // Log the response

    // Send emails only if the Google Apps Script request is successful
    if (response.data.result === "success") {
      await sendCompanyEmail(req.body); // Send email to the company
      await sendUserEmail(req.body); // Send email to the user
    }

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error:", error.message);
    console.error("Error details:", error.response?.data); // Log detailed error
    res.status(500).json({ result: "error", message: error.message });
  }
});

const url = process.env.URL;

app.post("/submit-enrollment", async (req, res) => {
  console.log("Received enrollment form data:", req.body); // Log the incoming data

  try {
    if (
      !req.body.name ||
      !req.body.email ||
      !req.body.mobile ||
      !req.body.interestDomain
    ) {
      return res.status(400).json({
        result: "error",
        message: "Missing required fields",
      });
    }
    const response = await axios.post(url, req.body, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(req.body),
      // console.log(response);
      console.log("Google Apps Script response:", response.data);
    if (response.data.result === "success") {
      res.status(200).json({
        result: "success",
        message: "Enrollment data submitted successfully.",
      });
    } else {
      res.status(400).json({ result: "error", message: response.data.message });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .json({ result: "error", message: "Failed to submit enrollment data" });
  }
});

async function generateOrderId() {
  const uniqueId = crypto.randomBytes(16).toString("hex");

  const hash = crypto.createHash("sha256");
  hash.update(uniqueId);

  const orderId = hash.digest("hex");

  return orderId.substr(0, 12);
}

const razorpay = new Razorpay({
  key_id: process.env.Razorpay_Id, // Replace with your Razorpay Key ID
  key_secret: process.env.Razorpay_secret_key, // Replace with your Razorpay Key Secret
});

app.post("/create-payment-order", async (req, res) => {
  const { orderAmount, customerName, customerEmail, customerPhone } = req.body;

  const options = {
    amount: orderAmount * 100, // Razorpay expects amount in paise
    currency: "INR",
    receipt: `receipt_${Math.random().toString(36).substr(2, 9)}`,
    payment_capture: 1, // Auto-capture payment
    notes: {
      customerName,
      customerEmail,
      customerPhone,
    },
  };

  try {
    const response = await razorpay.orders.create(options);
    res.status(200).json({
      id: response.id,
      currency: response.currency,
      amount: response.amount,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});

import type {   
    MedusaRequest,   
    MedusaResponse,  
  } from "@medusajs/medusa";  
  import { EntityManager } from "typeorm";  
  const Scrypt = require('scrypt-kdf');
  import SibApi from 'sib-api-v3-sdk';
  import { v4 as uuidv4 } from 'uuid';


const SibClient = SibApi.ApiClient.instance;
const apiInstance = new SibApi.TransactionalEmailsApi();
const sendSmtpEmail = new SibApi.SendSmtpEmail();

  // Authentication
  SibClient.authentications["api-key"].apiKey =process.env.EMAILKEY
  
  export const POST = async (req: any, res: MedusaResponse) => {  
    try {  
      const manager: EntityManager = req.scope.resolve("manager");  
      const { first_name, email, password, phone } = req.body;

      const id = uuidv4();
  
      // Check if user already exists
      const userCheckQuery = `SELECT * FROM customer WHERE email = $1;`;
      const existingUsers = await manager.query(userCheckQuery, [email]);
  
      if (existingUsers.length > 0) {
        // User already exists
        res.status(400).json({ message: 'User already exists' });
        return;
      }
  
      // Hash the password
      const keyBuf = await Scrypt.kdf(password, { logN: 15 });
      const passwordHash = keyBuf.toString('base64');
  
      // Generate OTP
      const otp = await generateOtp();
  
      // Store OTP in metadata
      const metadata = { otp };
  
      // Insert new user into the database
      const insertUserQuery = `
        INSERT INTO customer (id,first_name, email, password_hash, phone, has_account, metadata)
        VALUES ($1, $2, $3, $4,$5, false, $6)
        RETURNING *;
      `;
      const newUser = await manager.query(insertUserQuery, [id,first_name, email, passwordHash, phone, JSON.stringify(metadata)]);
  
      // Send OTP to user's email
      await sendOtp(email, otp);
  
      res.status(201).json({ message: 'User registered successfully', data: newUser });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'An error occurred' });
    }
  };
  
  async function sendOtp(email: string, otp: string): Promise<void> {
    console.log(`Sending OTP ${otp} to email ${email}`);
  
    const personalizedTemplate = `<p>Your OTP code is: ${otp}</p>`;
  
    sendSmtpEmail.sender = { email: 'usmanjamil196@gmail.com' };
    sendSmtpEmail.to = [{ email: email }];
    sendSmtpEmail.subject = 'OTP';
    sendSmtpEmail.htmlContent = personalizedTemplate;
  
    try {
      const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('Email sent successfully:', data);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
  
  async function generateOtp(): Promise<string> {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
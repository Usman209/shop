import { Customer, TransactionBaseService, User } from "@medusajs/medusa"
import { EntityManager } from "typeorm"
import { v4 as uuidv4 } from 'uuid';
const SibApi = require('sib-api-v3-sdk');
const SibClient = SibApi.ApiClient.instance;


const apiInstance = new SibApi.TransactionalEmailsApi();
const sendSmtpEmail = new SibApi.SendSmtpEmail();

// Authentication
SibClient.authentications["api-key"].apiKey = process.env.EMAILKEY
class AuthService extends TransactionBaseService {


  protected customerRepository_: any

  constructor(container) {
    super(container)
    this.customerRepository_ = container.customerRepository
  }

  async list(): Promise<any[]> {
    const postRepo = this.activeManager_.getRepository(
      Customer
    )
    return await postRepo.find()
  }

async  sendOtp(phone: string, otp: string): Promise<void> {
    console.log(`Sending OTP ${otp} to phone ${phone}`);
  
    // Replace the OTP placeholder with the actual OTP
    const personalizedTemplate = `<p>Your OTP code is: ${otp}</p>`;
  
    // Configure the email
    sendSmtpEmail.sender = { email: 'usmanjamil196@gmail.com' };
    sendSmtpEmail.to = [{ email: phone }];
    sendSmtpEmail.subject = 'OTP';
    sendSmtpEmail.htmlContent = personalizedTemplate;
  
    // Send the email
    try {
      const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('Email sent successfully:', data);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

async  generateOtp(): Promise<string> {
  // Generate a 6-digit OTP. You can modify this as per your requirements.
  return Math.floor(100000 + Math.random() * 900000).toString();
}


async registerUser(data: { phone: string, email: string, password: string }): Promise<any> {
  // Check if user is already registered and verified
  const checkQuery = `
    SELECT *
    FROM public.customer
    WHERE metadata ->> 'verified' = 'true'
    AND phone = $1
    ORDER BY id ASC;
  `;
  const existingUsers = await this.manager_.query(checkQuery, [data.phone]);

  if (existingUsers.length > 0) {
    // User is already registered and verified
    return { message: 'User is already registered and verified.' };
  } else {
    // Check if user exists but not verified
    const userQuery = `
      SELECT *
      FROM public.customer
      WHERE phone = $1
      ORDER BY id ASC;
    `;
    const users = await this.manager_.query(userQuery, [data.phone]);

    if (users.length > 0) {
      // User exists but not verified, update record and send OTP
      const user = users[0];
      const metadata = JSON.parse(user.metadata || '{}');
      const otp = await this.generateOtp();
      metadata.otp = otp;

      const updateQuery = `
        UPDATE public.customer
        SET metadata = $1
        WHERE id = $2
        RETURNING *;
      `;
      const updatedUser = await this.manager_.query(updateQuery, [JSON.stringify(metadata), user.id]);
      await this.sendOtp(data.phone, otp);
      return updatedUser[0];
    } else {
      // Register new user
      const id = uuidv4();
      const otp = await this.generateOtp();
      const metadata = JSON.stringify({ otp });

      const insertQuery = `
        INSERT INTO public.customer (id, phone, email, password, metadata)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const newUser = await this.manager_.query(insertQuery, [id, data.phone, data.email, data.password, metadata]);
      await this.sendOtp(data.phone, otp);
      return newUser[0];
    }
  }
}

async verifyUser(phone: string, otp: string): Promise<boolean> {
  // Retrieve user by userId
  const userCheckQuery = `
    SELECT * FROM customer WHERE phone = $1;
  `;
  const existingUsers = await this.manager_.query(userCheckQuery, [phone]);

  if (existingUsers.length === 0) {
    return false; // User not found
  }

  const user = existingUsers[0];
  const metadata = JSON.parse(user.metadata || '{}');

  if (metadata.otp === otp) {
    // OTP is correct, update metadata to set verified flag
    metadata.verified = true;

    const updateQuery = `
      UPDATE customer SET metadata = $1 WHERE phone = $2 RETURNING *;
    `;
    const updatedUser = await this.manager_.query(updateQuery, [JSON.stringify(metadata), phone]);
    return true; // User successfully verified
  } else {
    return false; // Invalid OTP
  }
}



async loginUser(data: { phone: string, password: string }): Promise<any> {
  // Check if user exists and is verified
  const loginQuery = `
    SELECT *
    FROM public.customer
    WHERE phone = $1
    AND password = $2
    AND metadata ->> 'verified' = 'true';
  `;
  const users = await this.manager_.query(loginQuery, [data.phone, data.password]);

  if (users.length === 1) {
    // User found and verified, return user data
    return { message: 'Login successful.', user: users[0] };
  } else if (users.length === 0) {
    // User not found or not verified
    throw new Error('Invalid phone or password, or user is not verified.');
  } else {
    // More than one user found (shouldn't happen if phone is unique)
    throw new Error('Multiple users found with the same phone number.');
  }
}


  }


 


export default AuthService  // Export AuthService

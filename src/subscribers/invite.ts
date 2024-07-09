import { EntityManager } from "typeorm";
import {
  type SubscriberConfig,
  type SubscriberArgs
} from "@medusajs/medusa";
import SibApi from 'sib-api-v3-sdk';

const SibClient = SibApi.ApiClient.instance;
const apiInstance = new SibApi.TransactionalEmailsApi();
const sendSmtpEmail = new SibApi.SendSmtpEmail();

// Authentication
SibClient.authentications["api-key"].apiKey = process.env.EMAILKEY


// console.log(process.env.EMAILKEY);

export default async function handleInviteCreated({
  data, eventName, container, pluginOptions,
}: SubscriberArgs<Record<string, string>>) {
  try {

    const manager: EntityManager = container.resolve('manager');

    const user = await findUserByEmail(manager, data.email);

    if (user) {
      const otp = await generateOtp();
      await updateUserOtp(manager, user.id, otp);
      await sendOtp(data.email, otp);
    }

  } catch (error) {
    console.error('Error handling invite:', error);
  }
}

async function findUserByEmail(manager: EntityManager, email: string) {
  const userQuery = `
    SELECT *
    FROM public.customer
    WHERE email = $1
    ORDER BY id ASC;
  `;
  const users = await manager.query(userQuery, [email]);
  return users.length > 0 ? users[0] : null;
}

async function updateUserOtp(manager: EntityManager, userId: string, otp: string) {
  const updateQuery = `
    UPDATE public.customer
    SET metadata = $1
    WHERE id = $2
    RETURNING *;
  `;
  const metadata = { otp };
  const updatedUser = await manager.query(updateQuery, [JSON.stringify(metadata), userId]);
  return updatedUser[0];
}

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

export const config: SubscriberConfig = {
  event: "customer.password_reset",
  context: {
    subscriberId: "invite-created-handler",
  },
};

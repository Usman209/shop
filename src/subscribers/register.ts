import { EntityManager } from "typeorm";
import {
  type SubscriberConfig,
  type SubscriberArgs
} from "@medusajs/medusa";
import { v4 as uuidv4 } from 'uuid';  


export default async function handleRegisterCreated({
  data, eventName, container, pluginOptions,
}: SubscriberArgs<Record<string, string>>) {
  try {
    const manager: EntityManager = container.resolve('manager');

    const order = await createGiftCard(manager, data.email);


  } catch (error) {
    console.error('Error handling register:', error);
    // Handle or rethrow the error as needed
    throw error;
  }
}


function generatePattern() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const getRandomCharacter = () => characters.charAt(Math.floor(Math.random() * characters.length));

  let pattern = Array.from({ length: 4 }, () => Array.from({ length: 4 }, getRandomCharacter).join('')).join('-');

  return pattern;
}

async function createGiftCard(manager: EntityManager, email: string) {
  try {
    const giftUuid = `gift_${uuidv4()}`;  // Generate UUID with 'gift_' prefix
    const generatedCode = generatePattern();  // Generate random code using the function

    const defaultValue = 50;  // Default value for both value and balance
    const metadata = { email };  // Metadata object with email field

    const insertQuery = `
      INSERT INTO public.gift_card (id, code, region_id, value, balance, metadata)
      VALUES (
        $1,                                      -- id with 'gift_' prefix UUID
        $2,                                      -- generated code
        'reg_01J3CJMGRBNWE7NE316RWDBSFV',         -- hardcoded region_id
        $3,                                       -- value (same as balance)
        $3,                                       -- balance
        $4                                       -- metadata with email from param
      )
      RETURNING *
    `;
    const result = await manager.query(insertQuery, [giftUuid, generatedCode, defaultValue, JSON.stringify(metadata)]);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Error creating gift card:', error);
    throw error;
  }
}

export const config: SubscriberConfig = {
  event: "customer.created",
  context: {
    subscriberId: "register-created-handler",
  },
};

import { EntityManager } from "typeorm";
import {
  type SubscriberConfig,
  type SubscriberArgs
} from "@medusajs/medusa";

export default async function handlePointCreated({
  data, eventName, container, pluginOptions,
}: SubscriberArgs<Record<string, string>>) {
  try {
    const manager: EntityManager = container.resolve('manager');

    console.log('Data received:', data);

    const order = await findOrderById(manager, data.id);

    if (!order) {
      throw new Error(`Order with id ${data.id} not found`);
    }

    const payment = await findPaymentByOrderId(manager, data.id);

    if (!payment) {
      throw new Error(`Payment for order ${order.id} not found`);
    }

    // Check condition and update payment
    if (payment && order.email !== 'guest@yahoo.com') {
      const updatedPayment = await updatePaymentByEmailAndAmount(manager,order.email ,payment.amount);
    }

  } catch (error) {
    console.error('Error handling point:', error);
    // Handle or rethrow the error as needed
    throw error;
  }
}

async function findOrderById(manager: EntityManager, id: string) {
  try {
    const userQuery = `
      SELECT *
      FROM public.order
      WHERE id = $1
      ORDER BY id ASC;
    `;
    const order = await manager.query(userQuery, [id]);
    return order.length > 0 ? order[0] : null;
  } catch (error) {
    console.error('Error finding order by id:', error);
    throw error;
  }
}

async function findPaymentByOrderId(manager: EntityManager, id: string) {
  try {
    const userQuery = `
      SELECT *
      FROM public.payment
      WHERE order_id = $1
      ORDER BY id ASC;
    `;
    const payment = await manager.query(userQuery, [id]);
    return payment.length > 0 ? payment[0] : null;
  } catch (error) {
    console.error('Error finding payment by order id:', error);
    throw error;
  }
}

async function updatePaymentByEmailAndAmount(manager: EntityManager, email: string, amount: number) {
    try {
      const userQuery = `
        UPDATE public.gift_card
        SET 
          balance = balance + ($1 * 0.05)
        WHERE metadata->>'email' = $2
        RETURNING *
      `;
      const result = await manager.query(userQuery, [amount, email]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error updating payment by email and amount:', error);
      throw error;
    }
  }

export const config: SubscriberConfig = {
  event: "order.shipment_created",
  context: {
    subscriberId: "point-created-handler",
  },
};

import { EntityManager } from "typeorm";
import { type SubscriberConfig, type SubscriberArgs } from "@medusajs/medusa";

export default async function handlePointCreated({
  data, eventName, container, pluginOptions,
}: SubscriberArgs<Record<string, string>>) {
  try {
    const manager: EntityManager = container.resolve('manager');

    console.log('Data received:', data);

    let order;
    try {
      order = await findOrderById(manager, data.id);
    } catch (error) {
      console.error('Error finding order by id:', error);
      throw error;
    }

    if (!order) {
      throw new Error(`Order with id ${data.id} not found`);
    }

    if (order.payment_status !== 'captured') {
      console.log(`Order ${data.id} payment not captured. Skipping.`);
      return;
    }

    let payment;
    try {
      payment = await findPaymentByOrderId(manager, data.id);
    } catch (error) {
      console.error('Error finding payment by order id:', error);
      throw error;
    }

    if (!payment) {
      throw new Error(`Payment for order ${data.id} not found`);
    }

    let customer;
    try {
      customer = await findCustomerById(manager, order.customer_id);
    } catch (error) {
      console.error('Error finding customer by id:', error);
      throw error;
    }

    if (!customer || !customer.has_account) {
      console.log(`Customer ${order.customer_id} does not have an account. Skipping.`);
      return;
    }

    let result;
    try {
      result = await manager.transaction(async (transactionalEntityManager) => {
        return await calculateAndAwardPoints(transactionalEntityManager, order.customer_id, payment.amount, data.id,customer?.email);
      });
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }

    console.log('Points awarded:', result.pointsAwarded);

  } catch (error) {
    console.error('Error handling point:', error);
    throw error;
  }
}

async function findOrderById(manager: EntityManager, id: string) {
  try {
    const order = await manager.query(`
      SELECT *
      FROM "order"
      WHERE id = $1
    `, [id]);
    return order.length > 0 ? order[0] : null;
  } catch (error) {
    console.error('Error finding order by id:', error);
    throw error;
  }
}

async function findPaymentByOrderId(manager: EntityManager, orderId: string) {
  try {
    const payment = await manager.query(`
      SELECT *
      FROM payment
      WHERE order_id = $1 AND data->>'status' = 'captured'
    `, [orderId]);
    return payment.length > 0 ? payment[0] : null;
  } catch (error) {
    console.error('Error finding payment by order id:', error);
    throw error;
  }
}

async function findCustomerById(manager: EntityManager, customerId: string) {
  try {
    const customer = await manager.query(`
      SELECT *
      FROM customer
      WHERE id = $1
    `, [customerId]);
    return customer.length > 0 ? customer[0] : null;
  } catch (error) {
    console.error('Error finding customer by id:', error);
    throw error;
  }
}

async function calculateAndAwardPoints(manager: EntityManager, customerId: string, orderAmount: number, orderId: string,email:string) {
  try {
    // Get the total amount spent by the customer including the current order
    let totalAmount;
    try {
      totalAmount = await getTotalAmountByCustomerId(manager, customerId) + orderAmount;
    } catch (error) {
      console.error('Error getting total amount by customer id:', error);
      throw error;
    }

    // Get the total points awarded so far
    let totalPointsAwarded;
    try {
      totalPointsAwarded = await getTotalPointsAwardedByCustomerId(manager, customerId);
    } catch (error) {
      console.error('Error getting total points awarded by customer id:', error);
      throw error;
    }

    // Calculate the total possible points based on the new total amount
    const totalPointsPossible = Math.floor(totalAmount / 2000) * 100;

    // Calculate the new points to award
    const newPoints = totalPointsPossible - totalPointsAwarded;

        const isDisabled = totalPointsPossible < 400;


        console.log('totalPointsPossible :',totalPointsPossible, 'totalPointsAwarded ',totalPointsAwarded, 'newPoints=========',newPoints);
        


    // Only award points if newPoints is positive
    if (newPoints > 0) {
      // Insert into points history with the correct order ID
      try {
        await insertPointsHistory(manager, customerId, orderId, newPoints);
      } catch (error) {
        console.error('Error inserting points history:', error);
        throw error;
      }

      // Insert into awarded_points table
      try {
        await manager.query(`
          INSERT INTO awarded_points (customer_id, amount, points_awarded)
          VALUES ($1, $2, $3)
        `, [customerId, orderAmount, newPoints]);
      } catch (error) {
        console.error('Error inserting awarded points:', error);
        throw error;
      }

      if(isDisabled){

        await manager.query(`
          UPDATE gift_card
          SET is_disabled = true
          WHERE metadata->>'email' = $1
        `, [email]);
      }

      return { pointsAwarded: newPoints };
    } else {
      return { pointsAwarded: 0 };
    }
  } catch (error) {
    console.error('Error calculating and awarding points:', error);
    throw error;
  }
}

async function getTotalAmountByCustomerId(manager: EntityManager, customerId: string) {
  try {
    const result = await manager.query(`
      SELECT COALESCE(SUM(p.amount), 0) AS total_amount
      FROM "order" o
      JOIN payment p ON o.id = p.order_id
      WHERE o.customer_id = $1 AND p.data->>'status' = 'captured'
    `, [customerId]);
    return parseFloat(result[0].total_amount);
  } catch (error) {
    console.error('Error getting total amount by customer id:', error);
    throw error;
  }
}

async function getTotalPointsAwardedByCustomerId(manager: EntityManager, customerId: string) {
  try {
    const result = await manager.query(`
      SELECT COALESCE(SUM(points_awarded), 0) AS total_points_awarded
      FROM awarded_points
      WHERE customer_id = $1
    `, [customerId]);
    return parseFloat(result[0].total_points_awarded);
  } catch (error) {
    console.error('Error getting total points awarded by customer id:', error);
    throw error;
  }
}

async function insertPointsHistory(manager: EntityManager, customerId: string, orderId: string, pointsAwarded: number) {
  try {
    await manager.query(`
      INSERT INTO points_history (customer_id, order_id, points_awarded)
      VALUES ($1, $2, $3)
    `, [customerId, orderId, pointsAwarded]);
  } catch (error) {
    console.error('Error inserting points history:', error);
    throw error;
  }
}

export const config: SubscriberConfig = {
  event: "order.payment_captured",
  context: {
    subscriberId: "point-created-handler",
  },
};







    // // Calculate the new points to award
    // const newPoints = totalPointsPossible - totalPointsAwarded;

    // // Determine if the account should be disabled
    // const isDisabled = totalPointsPossible < 400;
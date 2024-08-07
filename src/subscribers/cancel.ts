// import { EntityManager } from "typeorm";
// import { type SubscriberConfig, type SubscriberArgs } from "@medusajs/medusa";

// export default async function handleOrderCanceled({
//   data, eventName, container, pluginOptions,
// }: SubscriberArgs<Record<string, string>>) {
//   try {
//     const manager: EntityManager = container.resolve('manager');

//     console.log('Data received:', data);

//     let order;
//     try {
//       order = await findOrderById(manager, data.id);
//     } catch (error) {
//       console.error('Error finding order by id:', error);
//       throw error;
//     }

//     if (!order) {
//       throw new Error(`Order with id ${data.id} not found`);
//     }

//     let customer;
//     try {
//       customer = await findCustomerById(manager, order.customer_id);
//     } catch (error) {
//       console.error('Error finding customer by id:', error);
//       throw error;
//     }

//     if (!customer || !customer.has_account) {
//       console.log(`Customer ${order.customer_id} does not have an account. Skipping.`);
//       return;
//     }

//     let payment;
//     try {
//       payment = await findPaymentByOrderId(manager, data.id);
//     } catch (error) {
//       console.error('Error finding payment by order id:', error);
//       throw error;
//     }

//     if (!payment) {
//       console.log(`Payment for canceled order ${data.id} not found. Skipping.`);
//       return;
//     }

//     let result;
//     try {
//       result = await manager.transaction(async (transactionalEntityManager) => {
//         return await deductPoints(transactionalEntityManager, order.customer_id, payment.amount, data.id, customer.email);
//       });
//     } catch (error) {
//       console.error('Transaction error:', error);
//       throw error;
//     }

//     console.log('Points deducted:', result.pointsDeducted);
//   } catch (error) {
//     console.error('Error handling order canceled event:', error);
//     throw error;
//   }
// }

// async function findOrderById(manager: EntityManager, id: string) {
//   try {
//     const order = await manager.query(`
//       SELECT *
//       FROM "order"
//       WHERE id = $1
//     `, [id]);
//     return order.length > 0 ? order[0] : null;
//   } catch (error) {
//     console.error('Error finding order by id:', error);
//     throw error;
//   }
// }

// async function findPaymentByOrderId(manager: EntityManager, orderId: string) {
//   try {
//     const payment = await manager.query(`
//       SELECT *
//       FROM payment
//       WHERE order_id = $1 AND data->>'status' = 'captured'
//     `, [orderId]);
//     return payment.length > 0 ? payment[0] : null;
//   } catch (error) {
//     console.error('Error finding payment by order id:', error);
//     throw error;
//   }
// }

// async function findCustomerById(manager: EntityManager, customerId: string) {
//   try {
//     const customer = await manager.query(`
//       SELECT *
//       FROM customer
//       WHERE id = $1
//     `, [customerId]);
//     return customer.length > 0 ? customer[0] : null;
//   } catch (error) {
//     console.error('Error finding customer by id:', error);
//     throw error;
//   }
// }

// async function deductPoints(manager: EntityManager, customerId: string, orderAmount: number, orderId: string, email: string) {
//   try {
//     // Get the total amount spent by the customer
//     let totalAmount;
//     try {
//       totalAmount = await getTotalAmountByCustomerId(manager, customerId) - orderAmount;
//     } catch (error) {
//       console.error('Error getting total amount by customer id:', error);
//       throw error;
//     }

//     // Get the total points awarded so far
//     let totalPointsAwarded;
//     try {
//       totalPointsAwarded = await getTotalPointsAwardedByCustomerId(manager, customerId);
//     } catch (error) {
//       console.error('Error getting total points awarded by customer id:', error);
//       throw error;
//     }

//     // Calculate the total possible points based on the new total amount
//     const totalPointsPossible = Math.floor(totalAmount / 2000) * 100;

//     // Calculate the points to deduct
//     const pointsToDeduct = totalPointsAwarded - totalPointsPossible;

//     console.log('totalPointsPossible:', totalPointsPossible, 'totalPointsAwarded:', totalPointsAwarded, 'pointsToDeduct:', pointsToDeduct);

//     // Only deduct points if pointsToDeduct is positive
//     if (pointsToDeduct > 0) {
//       // Delete from awarded_points table
//       try {
//         await manager.query(`
//           DELETE FROM awarded_points
//           WHERE customer_id = $1 AND points_awarded = $2
//         `, [customerId, pointsToDeduct]);
//       } catch (error) {
//         console.error('Error deleting awarded points:', error);
//         throw error;
//       }

//       // Insert into points history with the correct order ID
//       try {
//         await insertPointsHistory(manager, customerId, orderId, -pointsToDeduct);
//       } catch (error) {
//         console.error('Error inserting points history:', error);
//         throw error;
//       }

//       // Update the gift card if applicable
//       // Uncomment if needed
//       /*
//       await manager.query(`
//         UPDATE gift_card
//         SET is_disabled = true
//         WHERE metadata->>'email' = $1
//       `, [email]);
//       */

//       return { pointsDeducted: pointsToDeduct };
//     } else {
//       return { pointsDeducted: 0 };
//     }
//   } catch (error) {
//     console.error('Error deducting points:', error);
//     throw error;
//   }
// }

// async function getTotalAmountByCustomerId(manager: EntityManager, customerId: string) {
//   try {
//     const result = await manager.query(`
//       SELECT COALESCE(SUM(p.amount), 0) AS total_amount
//       FROM "order" o
//       JOIN payment p ON o.id = p.order_id
//       WHERE o.customer_id = $1 AND p.data->>'status' = 'captured'
//     `, [customerId]);
//     return parseFloat(result[0].total_amount);
//   } catch (error) {
//     console.error('Error getting total amount by customer id:', error);
//     throw error;
//   }
// }

// async function getTotalPointsAwardedByCustomerId(manager: EntityManager, customerId: string) {
//   try {
//     const result = await manager.query(`
//       SELECT COALESCE(SUM(points_awarded), 0) AS total_points_awarded
//       FROM awarded_points
//       WHERE customer_id = $1
//     `, [customerId]);
//     return parseFloat(result[0].total_points_awarded);
//   } catch (error) {
//     console.error('Error getting total points awarded by customer id:', error);
//     throw error;
//   }
// }

// async function insertPointsHistory(manager: EntityManager, customerId: string, orderId: string, pointsAwarded: number) {
//   try {
//     await manager.query(`
//       INSERT INTO points_history (customer_id, order_id, points_awarded)
//       VALUES ($1, $2, $3)
//     `, [customerId, orderId, pointsAwarded]);
//   } catch (error) {
//     console.error('Error inserting points history:', error);
//     throw error;
//   }
// }

// export const config: SubscriberConfig = {
//   event: "order.canceled",
//   context: {
//     subscriberId: "order-canceled-handler",
//   },
// };

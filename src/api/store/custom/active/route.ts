import type {   
    MedusaRequest,   
    MedusaResponse,  
  } from "@medusajs/medusa";  
  import { EntityManager } from "typeorm";  
  
  export const POST = async (req: any, res: MedusaResponse) => {  
    try {  
      const manager: EntityManager = req.scope.resolve("manager");  
      const { email } = req.body;
  
      // Check if user exists
      const userCheckQuery = `SELECT * FROM customer WHERE email = $1;`;
      const existingUsers = await manager.query(userCheckQuery, [email]);
  
      if (existingUsers.length === 0) {
        // User not found
        res.status(404).json({ message: 'User not found' });
        return;
      }
  
      const user = existingUsers[0];
  
      // Update has_account to true
      const updateQuery = `UPDATE customer SET has_account = true WHERE id = $1 RETURNING *;`;
      const updatedUser = await manager.query(updateQuery, [user.id]);
  
      res.status(200).json({ message: 'User updated successfully', data: updatedUser });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'An error occurred' });
    }
  };
  
import type {   
    MedusaRequest,   
    MedusaResponse,  
  } from "@medusajs/medusa"  
  import { EntityManager } from "typeorm"  
  const Scrypt = require('scrypt-kdf');

    
  export const POST = async (  
    req: any,   
    res: MedusaResponse  
  ) => {  
    try {  
      const manager: EntityManager = req.scope.resolve("manager")  
      const {email, password_hash} = req.body

      const userCheckQuery = `SELECT * FROM customer WHERE email = $1  AND has_account = true;;`
      const existingUsers = await manager.query(userCheckQuery, [email])
    
      if (existingUsers.length === 0) {
        // User not found
        res.status(404).json({ message: 'User not found' })
        return
      }

      const keyBuf = await Scrypt.kdf(password_hash, { logN: 15 });

      // Encode key buffer to base64 string
      const keyStr = keyBuf.toString('base64');
    
      const user = existingUsers[0]
    
      if (password_hash) {
        // Example: Update password field in customer table
        const updatePasswordQuery = `UPDATE customer SET password_hash = $1 WHERE id = $2 RETURNING *;`;
        const updatedUserWithPassword = await manager.query(updatePasswordQuery, [keyStr, user.id]);
        return res.status(200).json({ message: 'Password updated successfully', data: updatedUserWithPassword });
      } else {
        // Invalid OTP
        res.status(400).json({ message: 'Invalid Request' })
      }
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'An error occurred' })
    }
  }
  
import type {   
    MedusaRequest,   
    MedusaResponse,  
  } from "@medusajs/medusa"  
  import { EntityManager } from "typeorm"  
    
  export const POST = async (  
    req: any,   
    res: MedusaResponse  
  ) => {  
    try {  
      const manager: EntityManager = req.scope.resolve("manager")  
      const {email, otp} = req.body    
      const userCheckQuery = `SELECT * FROM customer WHERE email = $1   AND has_account = true;;`
      const existingUsers = await manager.query(userCheckQuery, [email])
    
      if (existingUsers.length === 0) {
        // User not found
        res.status(404).json({ message: 'User not found' })
        return
      }
    
      const user = existingUsers[0]
    
      if (user.metadata .otp === otp) {
        // OTP is correct, update metadata to set verified flag
        user.metadata.verified = true
        const updateQuery = `UPDATE customer SET metadata = $1 WHERE id = $2 RETURNING *;`
        const updatedUser = await manager.query(updateQuery, [JSON.stringify(user.metadata), user.id])

        res.status(200).json({
            data: updatedUser,
          });
    
      } else {
        // Invalid OTP
        res.status(400).json({ message: 'Invalid OTP' })
      }
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'An error occurred' })
    }
  }
  
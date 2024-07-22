import type {   
    MedusaRequest,   
    MedusaResponse,  
  } from "@medusajs/medusa";  
  import { EntityManager } from "typeorm";  
  
  export const POST = async (req: any, res: MedusaResponse) => {  
    try {  
      const manager: EntityManager = req.scope.resolve("manager");  
      const { email } = req.body;
  
      // Check if gift card exists
      const giftCardCheckQuery = `SELECT * FROM public.gift_card WHERE metadata->>'email' = $1;`;
      const existingGiftCards = await manager.query(giftCardCheckQuery, [email]);
  
      if (existingGiftCards.length === 0) {
        // Gift card not found
        res.status(404).json({ message: 'Gift card not found' });
        return;
      }
  
      const giftCard = existingGiftCards[0];
  
      // Optionally, you can perform any additional operations with the gift card data here
  
      res.status(200).json({ message: 'Gift card found successfully', data: giftCard });
    } catch (error) {
      console.error('Error retrieving gift card:', error);
      res.status(500).json({ message: 'An error occurred' });
    }
  };
  
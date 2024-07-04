import { Cart, Order } from "@medusajs/medusa";
import { FulfillmentService } from "medusa-interfaces";

class LocationFulfillmentService extends FulfillmentService {
  static identifier = "location-fulfillment";

  constructor() {
    super();
  }

  getFulfillmentOptions() {
    return [
      {
        id: "location-fulfillment",
      },
      {
        id: "location-fulfillment-return",
        is_return: true,
      },
    ];
  }

  validateFulfillmentData(_, data, cart) {
    return data;
  }

  validateOption(data) {
    return true;
  }

  async canCalculate() {
    return true;
  }


toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};

 calculateDistance = (userLocation) => {
    const restaurantLocation = {
        latitude: 31.5256401,
        longitude: 74.277457,
    };

    const earthRadiusKm = 6371;

    const dLat = this.toRadians(restaurantLocation.latitude - userLocation.latitude);
    const dLon = this.toRadians(restaurantLocation.longitude - userLocation.longitude);

    const lat1 = this.toRadians(userLocation.latitude);
    const lat2 = this.toRadians(restaurantLocation.latitude);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distanceKm = earthRadiusKm * c;
    return distanceKm;
};

 calculateShippingCharges = (distanceKm) => {
    if (distanceKm <= 5) {
        return 100;
    }
    const extraDistance = distanceKm - 5;
    const extraCharges = Math.ceil(extraDistance / 2) * 50;
    return 100 + extraCharges;
};



  async calculatePrice(
    optionData: { [x: string]: unknown },
    data: { [x: string]: unknown },
    cart: Cart,
    order:Order
  ): Promise<number> {
    console.log('value is ===============', cart.shipping_address.address_2);
    const coordinateStr= cart?.shipping_address?.address_2;


  const keyValuePairs = coordinateStr.split(', ').map(pair => pair.split(':')); 

// Convert array of pairs into an object
const coordinateObj = keyValuePairs.reduce((acc, [key, value]) => {
    acc[key.trim()] = parseFloat(value.trim()); // Parse number values if needed
    return acc;
}, {});


    // const userLocation = cart.metadata.location; // Assuming location is stored in metadata
    const distanceKm = this.calculateDistance(coordinateObj);
    const shippingCharges = this.calculateShippingCharges(distanceKm);


    return shippingCharges * 100 ? shippingCharges * 100 : 100*100 ; // Assuming you want to return the total in cents
};

  createReturn() {
    return Promise.resolve({});
  }

  createFulfillment() {
    return Promise.resolve({});
  }

  async cancelFulfillment() {
    return Promise.resolve({});
  }

  async retrieveDocuments() {
    return Promise.resolve([]);
  }
}

export default LocationFulfillmentService;

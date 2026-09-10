import { describe, it, expect } from "vitest";

// Dynamic Zone Shipping Calculation Engine
export const calculateDeliveryFee = ({
  subtotal = 0,
  shippingStatus = true,
  defaultFee = 2500,
  defaultFreeThreshold = 50000,
  shippingZones = [],
  customerLocation = "",
}) => {
  if (subtotal === 0 || shippingStatus === false) return 0;

  const locationQuery = (customerLocation || "").trim().toLowerCase();

  // 1. Check custom shipping zones
  if (locationQuery && Array.isArray(shippingZones) && shippingZones.length > 0) {
    const matchedZone = shippingZones.find((z) => {
      if (z.name?.toLowerCase().includes(locationQuery)) return true;
      return (
        Array.isArray(z.regions) &&
        z.regions.some((r) => locationQuery.includes(r.toLowerCase().trim()))
      );
    });

    if (matchedZone) {
      const zoneFee = Number(matchedZone.fee) || 0;
      const zoneThreshold = Number(matchedZone.freeShippingThreshold) || 0;
      if (zoneThreshold > 0 && subtotal >= zoneThreshold) {
        return 0; // Qualified for free delivery in this zone
      }
      return zoneFee;
    }
  }

  // 2. Fallback to store default delivery fee
  if (defaultFreeThreshold > 0 && subtotal >= defaultFreeThreshold) {
    return 0;
  }
  return Number(defaultFee) || 0;
};

// Cart Total Calculation Engine
export const calculateCartTotal = (cartItems, products) => {
  let total = 0;
  for (const itemId in cartItems) {
    const product = products.find((p) => p._id === itemId);
    if (product) {
      for (const size in cartItems[itemId]) {
        const qty = cartItems[itemId][size];
        if (qty > 0) {
          total += product.price * qty;
        }
      }
    }
  }
  return total;
};

describe("🚚 TrendyTek Unit Test Suite", () => {
  const mockZones = [
    {
      name: "Lagos Island Zone",
      fee: 1500,
      freeShippingThreshold: 30000,
      regions: ["Lekki", "Ikoyi", "Victoria Island"],
    },
    {
      name: "Abuja Central",
      fee: 3500,
      freeShippingThreshold: 60000,
      regions: ["Maitama", "Wuse", "Garki"],
    },
  ];

  const mockProducts = [
    { _id: "p1", name: "Classic Cotton Tee", price: 50 },
    { _id: "p2", name: "Denim Jacket", price: 120 },
  ];

  describe("Shipping Calculation Tests", () => {
    it("should return 0 fee if cart subtotal is 0", () => {
      expect(calculateDeliveryFee({ subtotal: 0, defaultFee: 2500 })).toBe(0);
    });

    it("should match custom zone by region (e.g. Lekki)", () => {
      const fee = calculateDeliveryFee({
        subtotal: 10000,
        defaultFee: 2500,
        shippingZones: mockZones,
        customerLocation: "Lekki Phase 1",
      });
      expect(fee).toBe(1500);
    });

    it("should grant free delivery if subtotal exceeds zone free threshold", () => {
      const fee = calculateDeliveryFee({
        subtotal: 35000,
        defaultFee: 2500,
        shippingZones: mockZones,
        customerLocation: "Lekki",
      });
      expect(fee).toBe(0);
    });

    it("should return 0 if shipping status is disabled store-wide", () => {
      const fee = calculateDeliveryFee({
        subtotal: 20000,
        shippingStatus: false,
        defaultFee: 2500,
      });
      expect(fee).toBe(0);
    });
  });

  describe("Cart Calculation Tests", () => {
    it("should accurately compute cart subtotal for multiple items and sizes", () => {
      const cartItems = {
        p1: { M: 2, L: 1 }, // (50 * 2) + (50 * 1) = 150
        p2: { XL: 1 },      // (120 * 1) = 120
      };
      const total = calculateCartTotal(cartItems, mockProducts);
      expect(total).toBe(270);
    });

    it("should return 0 for an empty cart", () => {
      const total = calculateCartTotal({}, mockProducts);
      expect(total).toBe(0);
    });
  });
});
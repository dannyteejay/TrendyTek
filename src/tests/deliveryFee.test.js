import { describe, it, expect } from "vitest";

// Dynamic Zone Shipping Calculation Engine
const calculateDeliveryFee = ({
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
        return 0; // Qualified for free zone delivery
      }
      return zoneFee;
    }
  }

  // 2. Default fallback fee & free threshold
  if (defaultFreeThreshold > 0 && subtotal >= defaultFreeThreshold) {
    return 0;
  }
  return Number(defaultFee) || 0;
};

describe("🚚 Delivery Fee & Zone Calculation Unit Tests", () => {
  const sampleZones = [
    {
      name: "Lagos Island Zone",
      fee: 1500,
      freeShippingThreshold: 30000,
      regions: ["Lekki", "Ikoyi", "Victoria Island"],
    },
  ];

  it("should return 0 delivery fee if cart is empty (subtotal = 0)", () => {
    const fee = calculateDeliveryFee({ subtotal: 0, defaultFee: 2500 });
    expect(fee).toBe(0);
  });

  it("should match custom shipping zone by region (e.g. Lekki)", () => {
    const fee = calculateDeliveryFee({
      subtotal: 15000,
      defaultFee: 2500,
      shippingZones: sampleZones,
      customerLocation: "Lekki Phase 1, Lagos",
    });
    expect(fee).toBe(1500);
  });

  it("should grant free shipping if subtotal exceeds zone free threshold", () => {
    const fee = calculateDeliveryFee({
      subtotal: 35000,
      defaultFee: 2500,
      shippingZones: sampleZones,
      customerLocation: "Lekki Phase 1",
    });
    expect(fee).toBe(0);
  });
});
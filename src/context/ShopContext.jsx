import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  authApi,
  productApi,
  cartApi,
  categoryApi,
  contentApi,
} from "../api";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const [currency, setCurrency] = useState("$");
  const [logo, setLogo] = useState(localStorage.getItem("storeLogo") || "");
  const [storeName, setStoreName] = useState(
    localStorage.getItem("storeName") || "TrendyTek"
  );

  // Dynamic Shipping & Distance Zones Configuration
  const [delivery_fee, setDeliveryFee] = useState(() => {
    const saved = localStorage.getItem("storeDeliveryFee");
    return saved !== null ? Number(saved) : 2500;
  });
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(() => {
    const saved = localStorage.getItem("storeFreeThreshold");
    return saved !== null ? Number(saved) : 0;
  });
  const [shippingStatus, setShippingStatus] = useState(() => {
    const saved = localStorage.getItem("storeShippingStatus");
    return saved !== null ? saved === "true" : true;
  });
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    localStorage.getItem("storeEstimatedDelivery") || "2 - 4 Business Days"
  );
  const [shippingZones, setShippingZones] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(
    localStorage.getItem("customerSelectedState") || ""
  );

  // Active Payment Gateways Configuration
  const [paymentGateways, setPaymentGateways] = useState({
    paystack: true,
    stripe: true,
    bank_transfer: true,
    crypto: true,
    cod: true,
  });

  // Bank Transfer Payment Details
  const [bankDetails, setBankDetails] = useState({
    bankName: "Guaranty Trust Bank (GTBank)",
    accountName: "TRENDYTEK ENTERPRISES LTD",
    accountNumber: "0123456789",
    bankInstructions: "Please use your Order Name or Phone Number as payment narration.",
  });

  // Categories Dynamic State
  const [categories, setCategories] = useState([]);

  // Footer Dynamic Data
  const [footerData, setFooterData] = useState({
    footerDescription:
      "Discover the best trends and everyday essentials. Premium quality, fast delivery, and dedicated customer care tailored for your lifestyle.",
    companyTitle: "COMPANY",
    companyLinks: [
      { title: "Home", url: "/" },
      { title: "About us", url: "/about" },
      { title: "Contact", url: "/contact" },
      { title: "Collection", url: "/collection" },
      { title: "Blog", url: "/blog" },
      { title: "FAQ", url: "/faq" },
    ],
    contactTitle: "GET IN TOUCH",
    contactPhone: "+1-212-456-7890",
    contactEmail: "contact@trendytek.com",
    contactAddress: "",
    copyrightText: "",
  });

  // 1. Direct Theme Management with Immediate DOM update
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  }, []);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [products, setProducts] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [userImage, setUserImage] = useState(
    localStorage.getItem("userImage") || ""
  );
  const [userName, setUserName] = useState(
    localStorage.getItem("userName") || ""
  );
  const [userEmail, setUserEmail] = useState(
    localStorage.getItem("userEmail") || ""
  );

  // Keep token synced cleanly: remove when logged out, save when logged in
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userImage");
    }
  }, [token]);

  // 2. Fetch live categories via API Layer
  const getCategoriesData = async () => {
    try {
      const response = await categoryApi.getCategories();
      if (response && response.success && response.categories) {
        setCategories(response.categories);
      }
    } catch (error) {
      console.error("Categories fetch error:", error.message);
    }
  };

  // 3. Fetch store settings via API Layer
  const getSettingsData = async () => {
    try {
      const response = await contentApi.getSettings();
      if (response && response.success && response.settings) {
        const s = response.settings;

        if (s.currency) {
          setCurrency(s.currency);
        }
        if (s.logo !== undefined) {
          setLogo(s.logo || "");
          localStorage.setItem("storeLogo", s.logo || "");
        }
        if (s.storeName) {
          setStoreName(s.storeName);
          localStorage.setItem("storeName", s.storeName);
        }

        // Set dynamic shipping fee & zones
        if (s.deliveryFee !== undefined) {
          const feeNum = Number(s.deliveryFee);
          setDeliveryFee(feeNum);
          localStorage.setItem("storeDeliveryFee", feeNum.toString());
        }
        if (s.freeShippingThreshold !== undefined) {
          const threshNum = Number(s.freeShippingThreshold);
          setFreeShippingThreshold(threshNum);
          localStorage.setItem("storeFreeThreshold", threshNum.toString());
        }
        if (s.shippingStatus !== undefined) {
          const statusBool = Boolean(s.shippingStatus);
          setShippingStatus(statusBool);
          localStorage.setItem("storeShippingStatus", statusBool.toString());
        }
        if (s.estimatedDelivery) {
          setEstimatedDelivery(s.estimatedDelivery);
          localStorage.setItem("storeEstimatedDelivery", s.estimatedDelivery);
        }
        if (Array.isArray(s.shippingZones)) {
          setShippingZones(s.shippingZones);
        }

        // Set active payment gateways from backend
        if (s.paymentGateways) {
          setPaymentGateways(s.paymentGateways);
        }

        // Set dynamic bank transfer details
        if (s.bankName || s.accountNumber) {
          setBankDetails({
            bankName: s.bankName || "Guaranty Trust Bank (GTBank)",
            accountName:
              s.accountName || "TRENDYTEK ENTERPRISES LTD",
            accountNumber: s.accountNumber || "0123456789",
            bankInstructions:
              s.bankInstructions ||
              "Please use your Order Name or Phone Number as payment narration.",
          });
        }

        // Set dynamic footer data
        setFooterData({
          footerDescription:
            s.footerDescription ||
            "Discover the best trends and everyday essentials. Premium quality, fast delivery, and dedicated customer care tailored for your lifestyle.",
          companyTitle: s.companyTitle || "COMPANY",
          companyLinks:
            s.companyLinks && s.companyLinks.length > 0
              ? s.companyLinks
              : [
                  { title: "Home", url: "/" },
                  { title: "About us", url: "/about" },
                  { title: "Contact", url: "/contact" },
                  { title: "Collection", url: "/collection" },
                ],
          contactTitle: s.contactTitle || "GET IN TOUCH",
          contactPhone:
            s.contactPhone || "+1-212-456-7890",
          contactEmail:
            s.contactEmail || "contact@trendytek.com",
          contactAddress: s.contactAddress || "",
          copyrightText: s.copyrightText || "",
        });
      }
    } catch (error) {
      console.error("Settings load error:", error.message);
    }
  };

  // Helper: Distance / Location-Based Shipping Fee Calculator
  const getDeliveryFee = (currentSubtotal = 0, customLocation = "") => {
    const subtotal = Number(currentSubtotal) || 0;
    if (subtotal === 0) return 0;
    if (shippingStatus === false) return 0;

    const locationQuery = (customLocation || selectedDestination || "").trim().toLowerCase();

    // 1. Check if matching any custom shipping zone
    if (locationQuery && Array.isArray(shippingZones) && shippingZones.length > 0) {
      const matchedZone = shippingZones.find((z) => {
        if (z.name?.toLowerCase().includes(locationQuery)) return true;
        if (Array.isArray(z.regions)) {
          return z.regions.some((r) => {
            const cleanReg = r.toLowerCase().trim();
            return (
              locationQuery.includes(cleanReg) || cleanReg.includes(locationQuery)
            );
          });
        }
        return false;
      });

      if (matchedZone) {
        const zoneFee = Number(matchedZone.fee) || 0;
        const zoneThreshold = Number(matchedZone.freeShippingThreshold) || 0;
        if (zoneThreshold > 0 && subtotal >= zoneThreshold) {
          return 0; // Qualified for zone free shipping!
        }
        return zoneFee;
      }
    }

    // 2. Fallback to standard delivery fee
    const fee = Number(delivery_fee) || 0;
    const fallbackThreshold = Number(freeShippingThreshold) || 0;
    if (fallbackThreshold > 0 && subtotal >= fallbackThreshold) {
      return 0;
    }
    return fee;
  };

  // Helper: Get matching zone information (name & delivery timeframe)
  const getActiveZoneInfo = (customLocation = "") => {
    const locationQuery = (customLocation || selectedDestination || "").trim().toLowerCase();

    if (locationQuery && Array.isArray(shippingZones) && shippingZones.length > 0) {
      const matched = shippingZones.find((z) => {
        if (z.name?.toLowerCase().includes(locationQuery)) return true;
        if (Array.isArray(z.regions)) {
          return z.regions.some((r) => {
            const cleanReg = r.toLowerCase().trim();
            return (
              locationQuery.includes(cleanReg) || cleanReg.includes(locationQuery)
            );
          });
        }
        return false;
      });

      if (matched) {
        return {
          name: matched.name,
          estimatedDelivery: matched.estimatedDelivery || estimatedDelivery,
          freeThreshold: Number(matched.freeShippingThreshold) || 0,
        };
      }
    }

    return {
      name: "Standard Shipping",
      estimatedDelivery: estimatedDelivery,
      freeThreshold: Number(freeShippingThreshold) || 0,
    };
  };

  // 4. Fetch logged in user profile via API Layer
  const getUserProfileData = async () => {
    try {
      const response = await authApi.getProfile();
      if (response && response.success && response.user) {
        if (response.user.image) {
          setUserImage(response.user.image);
          localStorage.setItem("userImage", response.user.image);
        }
        if (response.user.name) {
          setUserName(response.user.name);
          localStorage.setItem("userName", response.user.name);
        }
        if (response.user.email) {
          setUserEmail(response.user.email);
          localStorage.setItem("userEmail", response.user.email);
        }
      }
    } catch (error) {
      console.error("User profile load error:", error.message);
    }
  };

  // 5. Add to Cart with Instant Success Alert & API Layer Sync
  const addToCart = async (itemId, size) => {
    if (!size) {
      toast.error("Please select a size first");
      return;
    }

    let cartData = structuredClone(cartItems);

    if (cartData[itemId]) {
      if (cartData[itemId][size]) {
        cartData[itemId][size] += 1;
      } else {
        cartData[itemId][size] = 1;
      }
    } else {
      cartData[itemId] = {};
      cartData[itemId][size] = 1;
    }
    setCartItems(cartData);

    const productInfo = products.find((p) => p._id === itemId);
    const itemName = productInfo ? productInfo.name : "Product";
    toast.success(`🛒 "${itemName}" added to cart!`, {
      position: "top-right",
      autoClose: 2000,
    });

    if (token) {
      try {
        await cartApi.addToCart(itemId, size);
      } catch (error) {
        console.error("Cart add error:", error.message);
      }
    }
  };

  // 6. Cart Count
  const getCartCount = () => {
    let totalCount = 0;
    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0) {
            totalCount += cartItems[items][item];
          }
        } catch (error) {
          console.error(error);
        }
      }
    }
    return totalCount;
  };

  // 7. Update Quantity via API Layer
  const updateQuantity = async (itemId, size, quantity) => {
    let cartData = structuredClone(cartItems);
    cartData[itemId][size] = quantity;
    setCartItems(cartData);

    if (token) {
      try {
        await cartApi.updateCart(itemId, size, quantity);
      } catch (error) {
        console.error("Cart update error:", error.message);
      }
    }
  };

  // 8. Cart Total Amount
  const getCartAmount = () => {
    let totalAmount = 0;
    for (const items in cartItems) {
      let itemInfo = products.find((product) => product._id === items);
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0 && itemInfo) {
            totalAmount += itemInfo.price * cartItems[items][item];
          }
        } catch (error) {
          console.error(error);
        }
      }
    }
    return totalAmount;
  };

  // 9. Get Products List via API Layer
  const getProductsData = async () => {
    try {
      const response = await productApi.getProducts();
      if (response && response.success && response.products) {
        setProducts(response.products.slice().reverse());
      }
    } catch (error) {
      console.error("Products fetch error:", error.message);
    }
  };

  // 10. Get User Cart via API Layer
  const getUserCart = async () => {
    try {
      const response = await cartApi.getCart();
      if (response && response.success && response.cartData) {
        setCartItems(response.cartData);
      }
    } catch (error) {
      console.error("Cart fetch error:", error.message);
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    getProductsData();
    getSettingsData();
    getCategoriesData();
  }, []);

  // ⚡ Smart Auto-Sync: Refreshes currency, settings & products in real-time without manual reload!
  useEffect(() => {
    const handleFocus = () => {
      getSettingsData();
      getProductsData();
      getCategoriesData();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        getSettingsData();
        getProductsData();
        getCategoriesData();
      }
    });

    const interval = setInterval(() => {
      getSettingsData();
      getProductsData();
      getCategoriesData();
    }, 15000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (token) {
      getUserCart();
      getUserProfileData();
    }
  }, [token]);

  // Context value object
  const value = {
    products,
    currency,
    setCurrency,
    logo,
    setLogo,
    storeName,
    setStoreName,
    categories,
    getCategoriesData,
    delivery_fee,
    setDeliveryFee,
    shippingZones,
    setShippingZones,
    selectedDestination,
    setSelectedDestination,
    freeShippingThreshold,
    setFreeShippingThreshold,
    shippingStatus,
    setShippingStatus,
    estimatedDelivery,
    setEstimatedDelivery,
    getDeliveryFee,
    getActiveZoneInfo,
    paymentGateways,
    setPaymentGateways,
    bankDetails,
    setBankDetails,
    footerData,
    setFooterData,
    theme,
    setTheme,
    toggleTheme,
    getSettingsData,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    addToCart,
    setCartItems,
    getCartCount,
    updateQuantity,
    getCartAmount,
    backendUrl,
    setToken,
    token,
    userImage,
    setUserImage,
    userName,
    setUserName,
    userEmail,
    setUserEmail,
  };

  return (
    <ShopContext.Provider value={value}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
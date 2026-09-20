import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

export const ShopContext = createContext();

// Default fallback exchange rates relative to Base Currency (₦ Nigerian Naira)
const DEFAULT_RATES_FROM_NGN = {
  "₦": 1,
  "$": 0.00075, // $1 ≈ ₦1,333
  "€": 0.00064, // €1 ≈ ₦1,560
  "£": 0.00055, // £1 ≈ ₦1,820
  "₹": 0.0704,  // ₹1 ≈ ₦14.2
  "C$": 0.00102, // C$1 ≈ ₦980
  "A$": 0.00103, // A$1 ≈ ₦970
  "GH₵": 0.0085, // GH₵1 ≈ ₦117
  "KSh": 0.0975, // KSh1 ≈ ₦10.2
  "R": 0.012,    // R1 ≈ ₦83.5
};

const SYMBOL_TO_CODE = {
  "₦": "NGN",
  "$": "USD",
  "€": "EUR",
  "£": "GBP",
  "₹": "INR",
  "C$": "CAD",
  "A$": "AUD",
  "GH₵": "GHS",
  "KSh": "KES",
  "R": "ZAR",
};

const ShopContextProvider = (props) => {
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL ||
    "https://fullstackbackend-wwiu.onrender.com";

  // Dynamic store currency synced directly from backend database
  const [currency, setCurrency] = useState(
    () => localStorage.getItem("storeCurrency") || "₦"
  );
  const [exchangeRates, setExchangeRates] = useState(() => {
    try {
      const saved = localStorage.getItem("storeExchangeRates");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [logo, setLogo] = useState(
    () =>
      localStorage.getItem("storeLogo") ||
      "https://res.cloudinary.com/mnlkie5f/image/upload/v1789507436/bpcelqaydv0js1qopikv.png"
  );
  const [storeName, setStoreName] = useState(
    () => localStorage.getItem("storeName") || "TRENDYTEK ENTERPRISES LIMITED"
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
    bankInstructions:
      "Please use your Order Name or Phone Number as payment narration.",
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

  // Theme Management
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

  // Fetch Live Real-World Exchange Rates (Base NGN)
  const fetchExchangeRates = async () => {
    try {
      const response = await axios.get("https://open.er-api.com/v6/latest/NGN");
      if (response.data && response.data.result === "success" && response.data.rates) {
        setExchangeRates(response.data.rates);
        localStorage.setItem("storeExchangeRates", JSON.stringify(response.data.rates));
      }
    } catch (error) {
      console.warn("Using fallback exchange rates:", error.message);
    }
  };

  // Convert raw base price (NGN) into active currency number
  const convertPrice = (basePriceInNgn) => {
    const priceNum = Number(basePriceInNgn) || 0;
    if (!currency || currency === "₦") {
      return priceNum;
    }
    const currCode = SYMBOL_TO_CODE[currency] || "USD";
    const liveRate = exchangeRates && exchangeRates[currCode];
    const fallbackRate = DEFAULT_RATES_FROM_NGN[currency] || 0.00075;
    const rate = liveRate || fallbackRate;
    return priceNum * rate;
  };

  // Format raw base price (NGN) into full display string: e.g. "$37.45", "₦50,000", "€32.00"
  const formatPrice = (basePriceInNgn) => {
    const priceNum = Number(basePriceInNgn) || 0;
    if (!currency || currency === "₦") {
      return `₦${Math.round(priceNum).toLocaleString()}`;
    }
    const converted = convertPrice(priceNum);
    if (currency === "₹" || currency === "KSh") {
      return `${currency}${Math.round(converted).toLocaleString()}`;
    }
    return `${currency}${converted.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Fetch live categories
  const getCategoriesData = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/category/list");
      if (response.data && response.data.success && response.data.categories) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.warn("Categories fetch error:", error.message);
    }
  };

  // Fetch store settings (Currency, Logo, Shipping, Gateways)
  const getSettingsData = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/settings/get");
      if (response.data && response.data.success && response.data.settings) {
        const s = response.data.settings;

        if (s.currency) {
          setCurrency(s.currency);
          localStorage.setItem("storeCurrency", s.currency);
        }
        if (s.logo) {
          setLogo(s.logo);
          localStorage.setItem("storeLogo", s.logo);
        }
        if (s.storeName) {
          setStoreName(s.storeName);
          localStorage.setItem("storeName", s.storeName);
        }

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

        if (s.paymentGateways) {
          setPaymentGateways(s.paymentGateways);
        }

        if (s.bankName || s.accountNumber) {
          setBankDetails({
            bankName: s.bankName || "Guaranty Trust Bank (GTBank)",
            accountName: s.accountName || "TRENDYTEK ENTERPRISES LTD",
            accountNumber: s.accountNumber || "0123456789",
            bankInstructions:
              s.bankInstructions ||
              "Please use your Order Name or Phone Number as payment narration.",
          });
        }

        if (s.footerDescription || s.companyTitle || s.contactPhone) {
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
            contactPhone: s.contactPhone || "+1-212-456-7890",
            contactEmail: s.contactEmail || "contact@trendytek.com",
            contactAddress: s.contactAddress || "",
            copyrightText: s.copyrightText || "",
          });
        }
      }
    } catch (error) {
      console.warn("Settings load error:", error.message);
    }
  };

  // Helper: Shipping Fee Calculator
  const getDeliveryFee = (currentSubtotal = 0, customLocation = "") => {
    const subtotal = Number(currentSubtotal) || 0;
    if (subtotal === 0) return 0;
    if (shippingStatus === false) return 0;

    const locationQuery = (customLocation || selectedDestination || "").trim().toLowerCase();

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
          return 0;
        }
        return zoneFee;
      }
    }

    const fee = Number(delivery_fee) || 0;
    const fallbackThreshold = Number(freeShippingThreshold) || 0;
    if (fallbackThreshold > 0 && subtotal >= fallbackThreshold) {
      return 0;
    }
    return fee;
  };

  // Helper: Zone Info
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

  // Fetch logged in user profile
  const getUserProfileData = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/user/profile", {
        headers: { token, Authorization: `Bearer ${token}` },
      });
      if (response.data && response.data.success && response.data.user) {
        if (response.data.user.image) {
          setUserImage(response.data.user.image);
          localStorage.setItem("userImage", response.data.user.image);
        }
        if (response.data.user.name) {
          setUserName(response.data.user.name);
          localStorage.setItem("userName", response.data.user.name);
        }
        if (response.data.user.email) {
          setUserEmail(response.data.user.email);
          localStorage.setItem("userEmail", response.data.user.email);
        }
      }
    } catch (error) {
      console.warn("User profile load error:", error.message);
    }
  };

  // Add to Cart
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
        await axios.post(
          backendUrl + "/api/cart/add",
          { itemId, size },
          { headers: { token, Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        console.error("Cart add error:", error.message);
      }
    }
  };

  // Cart Count
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

  // Update Quantity
  const updateQuantity = async (itemId, size, quantity) => {
    let cartData = structuredClone(cartItems);
    cartData[itemId][size] = quantity;
    setCartItems(cartData);

    if (token) {
      try {
        await axios.post(
          backendUrl + "/api/cart/update",
          { itemId, size, quantity },
          { headers: { token, Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        console.error("Cart update error:", error.message);
      }
    }
  };

  // Cart Total Base Amount (in NGN)
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

  // Get Products List
  const getProductsData = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list");
      if (response.data && response.data.success && response.data.products) {
        setProducts(response.data.products.slice().reverse());
      }
    } catch (error) {
      console.warn("Products fetch error:", error.message);
    }
  };

  // Get User Cart
  const getUserCart = async () => {
    try {
      const response = await axios.post(
        backendUrl + "/api/cart/get",
        {},
        { headers: { token, Authorization: `Bearer ${token}` } }
      );
      if (response.data && response.data.success && response.data.cartData) {
        setCartItems(response.data.cartData);
      }
    } catch (error) {
      console.warn("Cart fetch error:", error.message);
    }
  };

  // Initial Data Fetch & Auto-Refresh on focus
  useEffect(() => {
    fetchExchangeRates();
    getProductsData();
    getSettingsData();
    getCategoriesData();

    // Auto-sync settings whenever user focuses the tab
    const onFocus = () => {
      getSettingsData();
      fetchExchangeRates();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
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
    exchangeRates,
    convertPrice,
    formatPrice,
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
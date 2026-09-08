import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const [currency, setCurrency] = useState("$");
  const [logo, setLogo] = useState(localStorage.getItem("storeLogo") || "");
  const [storeName, setStoreName] = useState(
    localStorage.getItem("storeName") || "TrendyTek"
  );

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

  const delivery_fee = 10;
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

  // 2. Fetch live categories from database
  const getCategoriesData = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/category/list");
      if (response && response.data && response.data.success && response.data.categories) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error("Categories fetch error:", error.message);
    }
  };

  // 3. Fetch store settings (currency, logo, storeName, bank details, footer)
  const getSettingsData = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/settings/get");
      if (response && response.data && response.data.success && response.data.settings) {
        if (response.data.settings.currency) {
          setCurrency(response.data.settings.currency);
        }
        if (response.data.settings.logo !== undefined) {
          setLogo(response.data.settings.logo || "");
          localStorage.setItem("storeLogo", response.data.settings.logo || "");
        }
        if (response.data.settings.storeName) {
          setStoreName(response.data.settings.storeName);
          localStorage.setItem("storeName", response.data.settings.storeName);
        }

        // Set dynamic bank transfer details
        if (response.data.settings.bankName || response.data.settings.accountNumber) {
          setBankDetails({
            bankName: response.data.settings.bankName || "Guaranty Trust Bank (GTBank)",
            accountName:
              response.data.settings.accountName || "TRENDYTEK ENTERPRISES LTD",
            accountNumber: response.data.settings.accountNumber || "0123456789",
            bankInstructions:
              response.data.settings.bankInstructions ||
              "Please use your Order Name or Phone Number as payment narration.",
          });
        }

        // Set dynamic footer data
        setFooterData({
          footerDescription:
            response.data.settings.footerDescription ||
            "Discover the best trends and everyday essentials. Premium quality, fast delivery, and dedicated customer care tailored for your lifestyle.",
          companyTitle: response.data.settings.companyTitle || "COMPANY",
          companyLinks:
            response.data.settings.companyLinks &&
            response.data.settings.companyLinks.length > 0
              ? response.data.settings.companyLinks
              : [
                  { title: "Home", url: "/" },
                  { title: "About us", url: "/about" },
                  { title: "Contact", url: "/contact" },
                  { title: "Collection", url: "/collection" },
                ],
          contactTitle: response.data.settings.contactTitle || "GET IN TOUCH",
          contactPhone:
            response.data.settings.contactPhone || "+1-212-456-7890",
          contactEmail:
            response.data.settings.contactEmail || "contact@trendytek.com",
          contactAddress: response.data.settings.contactAddress || "",
          copyrightText: response.data.settings.copyrightText || "",
        });
      }
    } catch (error) {
      console.error("Settings load error:", error.message);
    }
  };

  // 4. Fetch logged in user profile
  const getUserProfileData = async (userToken) => {
    if (!userToken) return;
    try {
      const response = await axios.post(
        backendUrl + "/api/user/get-profile",
        {},
        { headers: { token: userToken } }
      );
      if (response && response.data && response.data.success && response.data.user) {
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
      console.error("User profile load error:", error.message);
    }
  };

  // 5. Add to Cart with Instant Success Alert
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
          { headers: { token } }
        );
      } catch (error) {
        console.error(error);
        toast.error(error.message);
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

  // 7. Update Quantity
  const updateQuantity = async (itemId, size, quantity) => {
    let cartData = structuredClone(cartItems);
    cartData[itemId][size] = quantity;
    setCartItems(cartData);

    if (token) {
      try {
        await axios.post(
          backendUrl + "/api/cart/update",
          { itemId, size, quantity },
          { headers: { token } }
        );
      } catch (error) {
        console.error(error);
        toast.error(error.message);
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

  // 9. Get Products List
  const getProductsData = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list");
      if (response && response.data && response.data.success && response.data.products) {
        setProducts(response.data.products.reverse());
      }
    } catch (error) {
      console.error("Products fetch error:", error.message);
    }
  };

  // 10. Get User Cart
  const getUserCart = async (userToken) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/cart/get",
        {},
        { headers: { token: userToken } }
      );
      if (response && response.data && response.data.success && response.data.cartData) {
        setCartItems(response.data.cartData);
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
    // 1. Tab Focus Auto-Sync: When user switches back to the store tab
    const handleFocus = () => {
      getSettingsData();
      getProductsData();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        getSettingsData();
        getProductsData();
      }
    });

    // 2. Background Polling (Silently syncs every 15 seconds)
    const interval = setInterval(() => {
      getSettingsData();
      getProductsData();
    }, 15000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (token) {
      getUserCart(token);
      getUserProfileData(token);
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
    bankDetails,
    setBankDetails,
    footerData,
    setFooterData,
    theme,
    setTheme,
    toggleTheme,
    getSettingsData,
    delivery_fee,
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
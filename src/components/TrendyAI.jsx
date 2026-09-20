import React, { useState, useEffect, useRef, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

/**
 * 🤖 TrendyAI - Multimodal Voice & Visual Smart Shopping Assistant
 * Features:
 * 1. 🎙️ Voice-driven ordering and search (Web Speech API)
 * 2. 📸 Image & screenshot product recognition (Visual matcher)
 * 3. 🛒 1-Click interactive "Add to Cart" and direct checkout
 * 4. 🔊 Voice response text-to-speech with mute toggle
 * 5. 💡 Smart catalog recommendation engine
 */
const TrendyAI = () => {
  const shopContext = useContext(ShopContext) || {};
  const {
    products = [],
    currency = "₦",
    addToCart = () => {},
    getCartAmount = () => 0,
  } = shopContext;

  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "ai",
      text: "👋 Hi there! I'm **TrendyAI**, your personal smart shopping assistant.\n\nYou can **speak to me** 🎙️ to find items, or **upload a photo/screenshot** 📸 of any product you want to buy!",
      timestamp: new Date(),
      products: [],
      suggestions: [
        "📸 Find product by photo",
        "🎙️ Order by voice",
        "🔥 Best sellers",
        "👗 New arrivals",
      ],
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Safe initialize Web Speech API
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
          setSpeechSupported(true);
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = "en-US";

          recognition.onstart = () => {
            setIsListening(true);
          };

          recognition.onresult = (event) => {
            try {
              const transcript = event.results[0][0].transcript;
              setIsListening(false);
              handleUserMessage(transcript);
            } catch (err) {
              console.warn("Speech parse error:", err);
              setIsListening(false);
            }
          };

          recognition.onerror = (event) => {
            console.warn("Speech recognition error:", event.error);
            setIsListening(false);
            if (event.error === "not-allowed") {
              toast.warn("Microphone access was blocked. Please enable it in your browser settings.");
            }
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current = recognition;
        }
      }
    } catch (e) {
      console.warn("Speech Recognition initialization failed:", e);
    }
  }, [products]);

  // Text-To-Speech response speaker
  const speakText = (text) => {
    if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel(); // Stop ongoing speech
      const cleanText = text
        .replace(/[*_#`]/g, "")
        .replace(/https?:\/\/\S+/g, "")
        .slice(0, 180);

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS error:", e);
    }
  };

  // Toggle Voice Recording
  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.info("Voice recognition is not supported in this browser. You can type or upload an image instead!");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        setIsListening(false);
      }
    } else {
      try {
        recognitionRef.current.start();
        toast.info("🎙️ Listening... Speak now!");
      } catch (e) {
        try {
          recognitionRef.current.stop();
        } catch (err) {}
      }
    }
  };

  // Fuzzy Catalog Search & Matcher Engine
  const searchCatalog = (query, filters = {}) => {
    if (!products || !Array.isArray(products) || products.length === 0) return [];

    const q = (query || "").toLowerCase().trim();
    if (!q) return products.slice(0, 4);

    const words = q.split(/\s+/).filter((w) => w.length > 2);

    let matches = products.filter((p) => {
      if (!p) return false;
      const pName = (p.name || "").toLowerCase();
      const pDesc = (p.description || "").toLowerCase();
      const pCat = (p.category || "").toLowerCase();
      const pSub = (p.subCategory || "").toLowerCase();

      // Category / Subcategory filter
      if (filters.category && !pCat.includes(filters.category.toLowerCase())) return false;
      if (filters.maxPrice && p.price > filters.maxPrice) return false;
      if (filters.minPrice && p.price < filters.minPrice) return false;

      // Exact phrase match in name, category, or subcategory
      if (pName.includes(q) || pCat.includes(q) || pSub.includes(q)) return true;

      // Word-by-word score
      const matchScore = words.reduce((score, w) => {
        if (pName.includes(w)) return score + 3;
        if (pCat.includes(w)) return score + 2;
        if (pDesc.includes(w)) return score + 1;
        return score;
      }, 0);

      return matchScore >= 2;
    });

    return matches.slice(0, 4);
  };

  // 🧠 Natural Language & Voice Intent Processor
  const processQuery = async (userQuery, imageAnalysisData = null) => {
    setIsProcessing(true);
    const lower = (userQuery || "").toLowerCase().trim();

    // 1. Direct Add To Cart by Voice (e.g., "Add black shirt to cart")
    if (lower.includes("add") && (lower.includes("cart") || lower.includes("bag"))) {
      let extractedSize = "Standard";
      const sizeMatch = lower.match(/\b(size\s+)?(xxl|xl|l|m|s|small|medium|large|extra large)\b/i);
      if (sizeMatch) {
        const rawSize = sizeMatch[2].toLowerCase();
        if (rawSize === "small" || rawSize === "s") extractedSize = "S";
        else if (rawSize === "medium" || rawSize === "m") extractedSize = "M";
        else if (rawSize === "large" || rawSize === "l") extractedSize = "L";
        else if (rawSize === "xl" || rawSize === "extra large") extractedSize = "XL";
        else if (rawSize === "xxl") extractedSize = "XXL";
      }

      const cleanQuery = lower
        .replace(/add|to|my|the|cart|bag|please|size|small|medium|large|extra|xl|xxl|m|l|s/gi, "")
        .trim();

      const matched = searchCatalog(cleanQuery || lower);

      if (matched.length > 0) {
        const item = matched[0];
        const finalSize =
          item.sizes && Array.isArray(item.sizes) && item.sizes.length > 0
            ? item.sizes.includes(extractedSize)
              ? extractedSize
              : item.sizes[0]
            : "Standard";

        try {
          addToCart(item._id, finalSize);
        } catch (err) {
          console.error("addToCart error:", err);
        }

        const reply = `🛒 I've added **${item.name}** (Size: ${finalSize}) to your shopping cart for **${currency}${item.price?.toLocaleString?.() || item.price}**!`;
        speakText(`I added ${item.name} to your cart.`);

        return {
          text: reply,
          products: [item],
          suggestions: ["Proceed to checkout", "View my cart", "Show more items"],
        };
      }
    }

    // 2. View Cart / Checkout
    if (lower.includes("view cart") || lower.includes("my cart") || lower.includes("checkout") || lower.includes("pay")) {
      const amount = getCartAmount();
      const reply = `🛒 Your cart total is **${currency}${amount?.toLocaleString?.() || amount}**. Would you like to proceed to checkout?`;
      speakText("Your cart is ready for checkout.");
      return {
        text: reply,
        products: [],
        suggestions: ["💳 Go to Checkout", "🛍️ Keep Shopping"],
        action: "cart",
      };
    }

    // 3. Best Sellers & Trends
    if (lower.includes("best") || lower.includes("popular") || lower.includes("trending") || lower.includes("top")) {
      const bestSellers = (products || []).filter((p) => p && p.bestSeller).slice(0, 4);
      const items = bestSellers.length > 0 ? bestSellers : (products || []).slice(0, 4);
      const reply = `🔥 Here are our **top best-selling items** right now:`;
      speakText("Here are our top trending best sellers.");
      return {
        text: reply,
        products: items,
        suggestions: ["Men's collection", "Women's collection", "Under ₦20,000"],
      };
    }

    // 4. Price-Filtered Search (e.g., "items under 15000", "cheap shoes")
    const priceMatch = lower.match(/(under|below|less than)\s*([0-9,]+)/i);
    if (priceMatch) {
      const maxPrice = Number(priceMatch[2].replace(/,/g, ""));
      const cleanTerm = lower.replace(/(under|below|less than)\s*([0-9,]+)/gi, "").trim();
      const items = searchCatalog(cleanTerm, { maxPrice });

      if (items.length > 0) {
        const reply = `💰 Here are items under **${currency}${maxPrice.toLocaleString()}**:`;
        speakText(`Found ${items.length} items within your budget.`);
        return { text: reply, products: items, suggestions: ["Show best sellers", "View all collection"] };
      }
    }

    // 5. Image-driven Query Handling
    if (imageAnalysisData) {
      const matches = searchCatalog(imageAnalysisData.keywords);
      const reply = `📸 **Visual Match Found:** I analyzed your image and found matching items in our store:`;
      speakText("I found matching products based on your image.");
      return {
        text: reply,
        products: matches.length > 0 ? matches : (products || []).slice(0, 3),
        suggestions: ["Add to cart", "Check other colors", "View collection"],
      };
    }

    // 6. General Catalog Search
    const foundItems = searchCatalog(lower);
    if (foundItems.length > 0) {
      const reply = `✨ Found **${foundItems.length} matching product${foundItems.length > 1 ? "s" : ""}** for "${userQuery}":`;
      speakText(`Found ${foundItems.length} products matching your request.`);
      return {
        text: reply,
        products: foundItems,
        suggestions: ["Add to cart", "Best sellers", "View all"],
      };
    }

    // 7. General Friendly Fallback
    const fallbackProducts = (products || []).slice(0, 3);
    const reply = `I couldn't find an exact match for "${userQuery}", but here are some of our popular recommendations you might love:`;
    speakText("Here are some popular recommendations from our store.");
    return {
      text: reply,
      products: fallbackProducts,
      suggestions: ["👗 Women's wear", "👔 Men's wear", "🔥 Best sellers"],
    };
  };

  // Submit User Message
  const handleUserMessage = async (text, imgData = null) => {
    if (!text && !imgData) return;

    const query = text || "Search with uploaded image";
    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      image: imgData?.preview || null,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setUploadedImagePreview(null);

    const result = await processQuery(query, imgData);
    setIsProcessing(false);

    const aiMsg = {
      id: (Date.now() + 1).toString(),
      sender: "ai",
      text: result.text,
      products: result.products || [],
      suggestions: result.suggestions || [],
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMsg]);
  };

  // 📸 Handle Image Upload / Screenshot Paste
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setUploadedImagePreview(base64);

      // Smart Visual Keyword Extraction based on filename
      const fileNameKeywords = file.name
        .replace(/[-_.]/g, " ")
        .replace(/\b(image|img|screenshot|photo|png|jpg|jpeg)\b/gi, "")
        .trim();

      const analysisData = {
        preview: base64,
        keywords: fileNameKeywords || "shirt dress shoes fashion cloth",
      };

      handleUserMessage("Find items matching this photo/screenshot 📸", analysisData);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* 1. Floating AI Shopping Launcher Button (Fixed at bottom-right corner) */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {!isOpen && (
          <div
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-full shadow-2xl text-xs font-bold text-gray-800 dark:text-gray-100 cursor-pointer hover:scale-105 transition-all"
            style={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)" }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></span>
            <span>Shop with Voice & Photo AI</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open AI Shopping Assistant"
          title="Open TrendyAI Assistant"
          className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-black via-gray-900 to-blue-600 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-white/30"
          style={{
            boxShadow: "0 10px 30px rgba(0, 102, 255, 0.4)",
          }}
        >
          {isOpen ? (
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <>
              {/* Bot / Sparkle Icon */}
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {/* Glowing AI Badge */}
              <span className="absolute -top-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-blue-600 text-[10px] font-extrabold items-center justify-center text-white border border-white">
                  AI
                </span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* 2. Interactive AI Shopping Modal / Drawer */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "95px",
            right: "20px",
            zIndex: 99999,
          }}
          className="w-[92vw] sm:w-[420px] h-[560px] max-h-[80vh] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-fade-in"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-gray-900 via-neutral-900 to-blue-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center text-base">
                ✨
              </div>
              <div>
                <h4 className="text-sm font-bold flex items-center gap-1.5 leading-tight">
                  TrendyAI Assistant
                  <span className="text-[10px] bg-blue-500/30 text-blue-200 px-1.5 py-0.2 rounded font-mono">Live</span>
                </h4>
                <p className="text-[10px] text-gray-300">Voice & Image-Powered Ordering</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Mute / Unmute TTS */}
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                title={voiceEnabled ? "Voice output enabled" : "Voice output muted"}
                className="p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                {voiceEnabled ? "🔊" : "🔇"}
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-neutral-950/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    msg.sender === "user"
                      ? "bg-black text-white rounded-br-xs"
                      : "bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-neutral-700 rounded-bl-xs"
                  }`}
                >
                  {/* User Uploaded Image Preview */}
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="Uploaded Query"
                      className="w-full max-h-36 object-cover rounded-lg mb-2 border border-white/20"
                    />
                  )}

                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {/* Interactive Product Recommendation Cards */}
                {msg.products && msg.products.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5 w-full max-w-[95%]">
                    {msg.products.map((item) => (
                      <div
                        key={item._id}
                        className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-2.5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all"
                      >
                        <div
                          onClick={() => {
                            setIsOpen(false);
                            navigate(`/product/${item._id}`);
                          }}
                          className="cursor-pointer"
                        >
                          <img
                            src={Array.isArray(item.image) ? item.image[0] : (item.image || "")}
                            alt={item.name}
                            className="w-full h-24 object-cover rounded-lg mb-1.5 bg-gray-100 dark:bg-neutral-700"
                          />
                          <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                            {item.name}
                          </h5>
                          <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                            {currency}{item.price?.toLocaleString?.() || item.price}
                          </p>
                        </div>

                        {/* 1-Click Order / Add to Cart */}
                        <button
                          onClick={() => {
                            const size = item.sizes?.[0] || "Standard";
                            addToCart(item._id, size);
                          }}
                          className="mt-2 w-full py-1.5 text-[11px] font-bold bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>🛒</span> Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Clickable Quick Suggestion Chips */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (sug.includes("photo")) fileInputRef.current?.click();
                          else if (sug.includes("voice")) toggleListening();
                          else if (sug.includes("Checkout")) {
                            setIsOpen(false);
                            navigate("/place-order");
                          } else if (sug.includes("Cart")) {
                            setIsOpen(false);
                            navigate("/cart");
                          } else {
                            handleUserMessage(sug);
                          }
                        }}
                        className="text-[11px] font-medium bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-full px-2.5 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer active:scale-95 transition-all"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-full px-3 py-1.5 w-fit animate-pulse">
                <span>🤖</span> Searching store catalog & analyzing...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Listening Pulsing Waveform Banner */}
          {isListening && (
            <div className="px-4 py-2 bg-red-500 text-white flex items-center justify-between animate-pulse text-xs font-semibold">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></span>
                🎙️ Listening to your voice... Speak your order!
              </span>
              <button
                onClick={toggleListening}
                className="underline text-[11px] font-bold cursor-pointer"
              >
                Stop
              </button>
            </div>
          )}

          {/* Input & Action Bar */}
          <div className="p-3 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUserMessage(inputText);
              }}
              className="flex items-center gap-2"
            >
              {/* Photo / Screenshot Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                hidden
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Search by image or screenshot"
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer text-lg"
              >
                📷
              </button>

              {/* Voice Microphone Button */}
              <button
                type="button"
                onClick={toggleListening}
                title="Order by Voice"
                className={`p-2 rounded-xl transition-all cursor-pointer text-lg ${
                  isListening
                    ? "bg-red-500 text-white animate-bounce"
                    : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                }`}
              >
                🎙️
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask, speak, or upload photo..."
                className="flex-1 px-3 py-2 text-xs sm:text-sm bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-black dark:focus:ring-white border border-transparent"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TrendyAI;
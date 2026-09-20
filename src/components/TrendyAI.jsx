import React, { useState, useEffect, useRef, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

/**
 * 🤖 TrendyAI - Multimodal Voice & Visual Smart Shopping Assistant
 */
const TrendyAI = () => {
  const { products, currency, addToCart, getCartAmount } = useContext(ShopContext);
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
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

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Web Speech API for voice recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        handleUserMessage(transcript);
      };
      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === "not-allowed") {
          toast.warn("Microphone access was blocked. Please enable it in your browser settings.");
        }
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [products]);

  // Voice speech output
  const speakText = (text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#`]/g, "").slice(0, 180);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS error:", e);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.info("Voice recognition is not supported in this browser. You can type or upload an image instead!");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        toast.info("🎙️ Listening... Speak now!");
      } catch (e) {
        recognitionRef.current.stop();
      }
    }
  };

  // Catalog search
  const searchCatalog = (query, filters = {}) => {
    if (!products || products.length === 0) return [];
    const q = (query || "").toLowerCase().trim();
    const words = q.split(/\s+/).filter((w) => w.length > 2);

    return products.filter((p) => {
      const pName = (p.name || "").toLowerCase();
      const pDesc = (p.description || "").toLowerCase();
      const pCat = (p.category || "").toLowerCase();

      if (filters.maxPrice && p.price > filters.maxPrice) return false;
      if (pName.includes(q) || pCat.includes(q) || pDesc.includes(q)) return true;

      return words.some((w) => pName.includes(w) || pCat.includes(w));
    }).slice(0, 4);
  };

  // Process User & Voice Commands
  const processQuery = async (userQuery, imageAnalysisData = null) => {
    setIsProcessing(true);
    const lower = userQuery.toLowerCase().trim();

    // 1. Voice Order / Add to Cart command
    if (lower.includes("add") && (lower.includes("cart") || lower.includes("bag"))) {
      let extractedSize = "Standard";
      const sizeMatch = lower.match(/\b(size\s+)?(xxl|xl|l|m|s|small|medium|large)\b/i);
      if (sizeMatch) {
        const raw = sizeMatch[2].toLowerCase();
        if (raw === "small" || raw === "s") extractedSize = "S";
        else if (raw === "medium" || raw === "m") extractedSize = "M";
        else if (raw === "large" || raw === "l") extractedSize = "L";
        else if (raw === "xl") extractedSize = "XL";
      }

      const cleanQuery = lower.replace(/add|to|my|the|cart|bag|please|size|small|medium|large|xl|s|m|l/gi, "").trim();
      const matched = searchCatalog(cleanQuery || lower);

      if (matched.length > 0) {
        const item = matched[0];
        const finalSize = item.sizes?.length > 0 ? (item.sizes.includes(extractedSize) ? extractedSize : item.sizes[0]) : "Standard";
        addToCart(item._id, finalSize);

        const reply = `🛒 Added **${item.name}** (Size: ${finalSize}) to your cart for **${currency}${item.price?.toLocaleString()}**!`;
        speakText(`I added ${item.name} to your cart.`);
        return { text: reply, products: [item], suggestions: ["View Cart", "Checkout", "Show more items"] };
      }
    }

    // 2. View Cart / Checkout
    if (lower.includes("cart") || lower.includes("checkout") || lower.includes("pay")) {
      const amount = getCartAmount();
      const reply = `🛒 Your cart total is **${currency}${amount?.toLocaleString()}**. Would you like to proceed to checkout?`;
      speakText("Your cart is ready for checkout.");
      return { text: reply, products: [], suggestions: ["💳 Go to Checkout", "🛍️ Keep Shopping"] };
    }

    // 3. Best Sellers
    if (lower.includes("best") || lower.includes("popular") || lower.includes("trending")) {
      const best = products.filter((p) => p.bestSeller).slice(0, 4);
      const items = best.length > 0 ? best : products.slice(0, 4);
      const reply = `🔥 Here are our **top best-selling items**:`;
      speakText("Here are our top trending best sellers.");
      return { text: reply, products: items, suggestions: ["Men's wear", "Women's wear", "Under ₦20,000"] };
    }

    // 4. Image search
    if (imageAnalysisData) {
      const matches = searchCatalog(imageAnalysisData.keywords);
      const reply = `📸 **Visual Match:** I analyzed your image and found matching products in our store:`;
      speakText("I found matching products based on your image.");
      return { text: reply, products: matches.length > 0 ? matches : products.slice(0, 3), suggestions: ["Add to cart", "View collection"] };
    }

    // 5. General Search
    const found = searchCatalog(lower);
    if (found.length > 0) {
      const reply = `✨ Found **${found.length} matching product${found.length > 1 ? "s" : ""}** for "${userQuery}":`;
      speakText(`Found ${found.length} products.`);
      return { text: reply, products: found, suggestions: ["Add to cart", "Best sellers", "View all"] };
    }

    // 6. Fallback
    const fallback = products.slice(0, 3);
    const reply = `Here are some popular recommendations from our store you might love:`;
    speakText("Here are some popular recommendations.");
    return { text: reply, products: fallback, suggestions: ["👗 Women", "👔 Men", "🔥 Best sellers"] };
  };

  const handleUserMessage = async (text, imgData = null) => {
    if (!text && !imgData) return;
    const query = text || "Search with uploaded image";
    const userMsg = { id: Date.now().toString(), sender: "user", text: query, image: imgData?.preview || null, timestamp: new Date() };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    const result = await processQuery(query, imgData);
    setIsProcessing(false);

    const aiMsg = { id: (Date.now() + 1).toString(), sender: "ai", text: result.text, products: result.products || [], suggestions: result.suggestions || [], timestamp: new Date() };
    setMessages((prev) => [...prev, aiMsg]);
  };

  // Image Upload Handler
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      const cleanKeywords = file.name.replace(/[-_.]/g, " ").replace(/\b(image|img|screenshot|photo|png|jpg|jpeg)\b/gi, "").trim();
      handleUserMessage("Find items matching this photo/screenshot 📸", { preview: base64, keywords: cleanKeywords || "fashion dress shirt shoes" });
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        {!isOpen && (
          <div
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-full shadow-lg text-xs font-semibold text-gray-800 dark:text-gray-200 cursor-pointer hover:scale-105 transition-all animate-bounce"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
            <span>Shop with Voice & Photo AI</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-black via-gray-900 to-blue-600 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-white/20"
        >
          {isOpen ? "✕" : "✨ AI"}
        </button>
      </div>

      {/* AI Assistant Modal Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[94vw] sm:w-[420px] h-[560px] max-h-[85vh] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-800 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-gray-900 to-blue-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <div>
                <h4 className="text-sm font-bold">TrendyAI Assistant</h4>
                <p className="text-[10px] text-gray-300">Voice & Photo Shopping</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setVoiceEnabled(!voiceEnabled)} className="text-base cursor-pointer">
                {voiceEnabled ? "🔊" : "🔇"}
              </button>
              <button onClick={() => setIsOpen(false)} className="text-sm cursor-pointer text-gray-300 hover:text-white">
                ✕
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-neutral-950/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm shadow-xs ${msg.sender === "user" ? "bg-black text-white" : "bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-neutral-700"}`}>
                  {msg.image && <img src={msg.image} alt="Uploaded query" className="w-full max-h-32 object-cover rounded-lg mb-2" />}
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {/* Product Cards */}
                {msg.products && msg.products.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2 w-full max-w-[95%]">
                    {msg.products.map((item) => (
                      <div key={item._id} className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
                        <div onClick={() => { setIsOpen(false); navigate(`/product/${item._id}`); }} className="cursor-pointer">
                          <img src={item.image?.[0] || ""} alt={item.name} className="w-full h-24 object-cover rounded-lg mb-1" />
                          <h5 className="text-xs font-bold line-clamp-1">{item.name}</h5>
                          <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400">{currency}{item.price?.toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => addToCart(item._id, item.sizes?.[0] || "Standard")}
                          className="mt-2 w-full py-1 text-[11px] font-bold bg-black dark:bg-white text-white dark:text-black rounded-lg active:scale-95 cursor-pointer"
                        >
                          🛒 Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestion Chips */}
                {msg.suggestions && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (sug.includes("photo")) fileInputRef.current?.click();
                          else if (sug.includes("voice")) toggleListening();
                          else if (sug.includes("Checkout")) { setIsOpen(false); navigate("/place-order"); }
                          else if (sug.includes("Cart")) { setIsOpen(false); navigate("/cart"); }
                          else handleUserMessage(sug);
                        }}
                        className="text-[11px] bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-full px-2.5 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isProcessing && <div className="text-xs text-gray-500 animate-pulse">🤖 Thinking & analyzing store items...</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Listening Pulsing Banner */}
          {isListening && (
            <div className="px-4 py-2 bg-red-500 text-white flex items-center justify-between animate-pulse text-xs font-semibold">
              <span>🎙️ Listening... Speak your order!</span>
              <button onClick={toggleListening} className="underline text-[11px]">Stop</button>
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800">
            <form onSubmit={(e) => { e.preventDefault(); handleUserMessage(inputText); }} className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} hidden />
              <button type="button" onClick={() => fileInputRef.current?.click()} title="Search by photo/screenshot" className="p-2 text-lg hover:bg-gray-100 rounded-lg cursor-pointer">
                📷
              </button>
              <button type="button" onClick={toggleListening} title="Order by voice" className={`p-2 text-lg rounded-lg cursor-pointer ${isListening ? "bg-red-500 text-white animate-bounce" : "text-blue-600 hover:bg-blue-50"}`}>
                🎙️
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask, speak, or upload photo..."
                className="flex-1 px-3 py-2 text-xs sm:text-sm bg-gray-100 dark:bg-neutral-800 rounded-xl outline-none"
              />
              <button type="submit" disabled={!inputText.trim()} className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-xl cursor-pointer">
                ➤
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TrendyAI;
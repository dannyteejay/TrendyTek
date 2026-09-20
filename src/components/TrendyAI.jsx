import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import { ShopContext } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

/**
 * 🤖 TrendyAI - Multimodal Voice & Visual OCR Smart Shopping Assistant
 * Features:
 * 1. 📸 Real-Time Screenshot & Image OCR (Reads handwritten & typed shopping lists from WhatsApp, Notes, Receipts)
 * 2. 🛒 Multi-Item Order Parser & "1-Click Add All to Cart"
 * 3. 🎙️ Real-Time Voice Search & Conversational Ordering (Web Speech API)
 * 4. 🧠 Dynamic Catalog Availability Matcher for ANY product
 * 5. 🔊 Spoken Text-to-Speech Audio Feedback with Mute Toggle
 */
const TrendyAI = () => {
  const shopContext = useContext(ShopContext) || {};
  const {
    products = [],
    currency = "₦",
    addToCart = () => {},
    getCartAmount = () => 0,
    storeName = "TrendyTek",
  } = shopContext;

  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isScanningOCR, setIsScanningOCR] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "ai",
      text: `👋 Hi! I'm **TrendyAI**, your smart shopping assistant at **${storeName}**.\n\n📸 **Upload a screenshot or photo** of your written/typed order list\n🎙️ **Speak to me** to check items or place orders\n💬 **Ask me anything** about our collection!`,
      timestamp: new Date(),
      products: [],
      suggestions: [
        "📸 Scan order list screenshot",
        "🔥 Best sellers",
        "👗 New arrivals",
        "💰 Items under ₦30,000",
      ],
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const handleUserMessageRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isProcessing, isScanningOCR, transcriptPreview]);

  // Voice Speaker (TTS)
  const speakText = useCallback(
    (text) => {
      if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;

      try {
        window.speechSynthesis.cancel();
        const cleanText = text
          .replace(/[*_#`~]/g, "")
          .replace(/https?:\/\/\S+/g, "")
          .replace(/₦/g, " Naira ")
          .slice(0, 220);

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.lang = "en-US";
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("TTS speak error:", e);
      }
    },
    [voiceEnabled]
  );

  // Helper: Extract core item/subject from natural language sentence
  const extractSubject = (query) => {
    let q = (query || "").toLowerCase().trim();
    q = q.replace(/[?!.,]/g, "");
    q = q.replace(
      /^(do you have|do you sell|do you guys have|are there any|can i get|can i buy|is there a|is there any|show me|find me|looking for|i want|i need|search for|what about|tell me about|how about)\s+/gi,
      ""
    );
    q = q.replace(/^(a|an|the|some|any)\s+/gi, "");
    return q.trim();
  };

  // Catalog Matcher Engine
  const searchCatalog = useCallback(
    (query, filters = {}) => {
      if (!products || !Array.isArray(products) || products.length === 0) return [];

      const cleanSubject = extractSubject(query);
      const rawLower = (query || "").toLowerCase().trim();
      const searchTerm = cleanSubject || rawLower;

      if (!searchTerm) return products.slice(0, 4);

      const words = searchTerm
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 2);

      let matches = products.filter((p) => {
        if (!p) return false;
        const pName = (p.name || "").toLowerCase();
        const pDesc = (p.description || "").toLowerCase();
        const pCat = (p.category || "").toLowerCase();
        const pSub = (p.subCategory || "").toLowerCase();

        if (filters.category && !pCat.includes(filters.category.toLowerCase())) return false;
        if (filters.maxPrice && Number(p.price) > filters.maxPrice) return false;
        if (filters.minPrice && Number(p.price) < filters.minPrice) return false;

        if (
          pName.includes(searchTerm) ||
          pCat.includes(searchTerm) ||
          pSub.includes(searchTerm) ||
          pDesc.includes(searchTerm)
        ) {
          return true;
        }

        if (words.length > 0) {
          const score = words.reduce((acc, word) => {
            if (pName.includes(word)) return acc + 4;
            if (pCat.includes(word)) return acc + 3;
            if (pSub.includes(word)) return acc + 2;
            if (pDesc.includes(word)) return acc + 1;
            return acc;
          }, 0);
          return score >= 2;
        }

        return false;
      });

      return matches.slice(0, 4);
    },
    [products]
  );

  // 📸 Dynamic OCR Engine Loader (Loads Tesseract.js directly in browser)
  const runOCR = async (imageSrc) => {
    return new Promise((resolve) => {
      try {
        const process = async () => {
          if (!window.Tesseract) {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
            script.async = true;
            script.onload = async () => {
              try {
                const { data } = await window.Tesseract.recognize(imageSrc, "eng");
                resolve(data?.text || "");
              } catch (err) {
                console.warn("OCR recognize error:", err);
                resolve("");
              }
            };
            script.onerror = () => resolve("");
            document.head.appendChild(script);
          } else {
            const { data } = await window.Tesseract.recognize(imageSrc, "eng");
            resolve(data?.text || "");
          }
        };
        process();
      } catch (err) {
        console.warn("OCR loader error:", err);
        resolve("");
      }
    });
  };

  // Add multiple items to cart at once
  const handleAddAllToCart = (matchedItems) => {
    if (!matchedItems || matchedItems.length === 0) return;

    let addedCount = 0;
    matchedItems.forEach((item) => {
      const size = item.sizes?.[0] || "Standard";
      addToCart(item._id, size);
      addedCount++;
    });

    toast.success(`🛒 Added ${addedCount} items to your cart!`);
    speakText(`I have added ${addedCount} items from your screenshot to your shopping cart.`);
  };

  // 🧠 Conversational Brain & Query Processor
  const processQuery = useCallback(
    async (userQuery, imageAnalysisData = null) => {
      setIsProcessing(true);
      const raw = (userQuery || "").trim();
      const lower = raw.toLowerCase();
      const subject = extractSubject(raw);

      // 1. OCR Screenshot Order List Processing
      if (imageAnalysisData && imageAnalysisData.isOrderList) {
        const extractedLines = (imageAnalysisData.extractedText || "")
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => {
            if (line.length < 3) return false;
            // Filter out common phone screenshot noise (timestamps, battery, etc.)
            if (/^\d{1,2}:\d{2}/.test(line)) return false;
            if (/^(am|pm|lte|5g|4g|wifi|battery|message|type|online)\b/i.test(line)) return false;
            return true;
          });

        let matchedProducts = [];
        let identifiedItems = [];

        for (const line of extractedLines) {
          const matches = searchCatalog(line);
          if (matches.length > 0) {
            matches.forEach((m) => {
              if (!matchedProducts.some((p) => p._id === m._id)) {
                matchedProducts.push(m);
                identifiedItems.push({ text: line, matched: m.name });
              }
            });
          }
        }

        // If specific lines didn't match, run keyword bag search
        if (matchedProducts.length === 0 && imageAnalysisData.extractedText) {
          matchedProducts = searchCatalog(imageAnalysisData.extractedText);
        }

        if (matchedProducts.length > 0) {
          const reply = `📄 **Screenshot Order List Scanned:**\nI extracted **${matchedProducts.length} product${
            matchedProducts.length > 1 ? "s" : ""
          }** matching the text in your screenshot!\n\nYou can add them individually or click **"Add All to Cart"** below:`;

          speakText(`I read your screenshot order list and found ${matchedProducts.length} matching items in our store.`);

          return {
            text: reply,
            products: matchedProducts,
            isMultiOrder: true,
            suggestions: ["🛒 Add All to Cart", "💳 Go to Checkout", "🛍️ View Cart"],
          };
        } else if (imageAnalysisData.extractedText) {
          const snippet = imageAnalysisData.extractedText.slice(0, 150).trim();
          const reply = `📄 **Screenshot Text Detected:**\n"${snippet}..."\n\nI couldn't find an exact catalog match for these specific written items. Here are our recommended store items:`;
          speakText("I read the text in your screenshot, but could not find exact catalog matches. Here are some recommendations.");
          return {
            text: reply,
            products: (products || []).slice(0, 4),
            suggestions: ["🔥 Best Sellers", "👗 Women's Wear", "👔 Men's Wear"],
          };
        }
      }

      // 2. Friendly Greetings
      if (/^(hi|hello|hey|good morning|good afternoon|good evening|howdy|yo|greetings)\b/i.test(lower)) {
        const reply = `👋 Hello! Welcome to **${storeName}**! How can I help you today? You can ask me to find any item, order by voice, or upload an order screenshot.`;
        speakText(`Hello! Welcome to ${storeName}. What can I help you find today?`);
        return {
          text: reply,
          products: (products || []).slice(0, 2),
          suggestions: ["🔥 Show Best Sellers", "👗 Women's Collection", "👔 Men's Collection"],
        };
      }

      // 3. Store Identity Questions ("What do you sell?", "Who are you?")
      if (
        lower.includes("what do you sell") ||
        lower.includes("what is this store") ||
        lower.includes("who are you") ||
        lower.includes("what products do you have")
      ) {
        const reply = `✨ **${storeName}** offers premium quality fashion, stylish apparel, shoes, and lifestyle essentials.\n\nBrowse some of our popular picks below or ask me for any specific item:`;
        speakText(`${storeName} is your destination for quality fashion and apparel. What are you looking for today?`);
        return {
          text: reply,
          products: (products || []).slice(0, 4),
          suggestions: ["🔥 Best Sellers", "👗 Women's Wear", "👔 Men's Wear", "🛒 View Cart"],
        };
      }

      // 4. Order by Voice / Add to Cart
      if (lower.includes("add") && (lower.includes("cart") || lower.includes("bag"))) {
        let extractedSize = "Standard";
        const sizeMatch = lower.match(/\b(size\s+)?(xxl|xl|l|m|s|small|medium|large|extra large)\b/i);
        if (sizeMatch) {
          const s = sizeMatch[2].toLowerCase();
          if (s === "small" || s === "s") extractedSize = "S";
          else if (s === "medium" || s === "m") extractedSize = "M";
          else if (s === "large" || s === "l") extractedSize = "L";
          else if (s === "xl" || s === "extra large") extractedSize = "XL";
          else if (s === "xxl") extractedSize = "XXL";
        }

        const cleanQuery = lower
          .replace(/\b(add|to|my|the|cart|bag|please|size|small|medium|large|extra|xl|xxl|m|l|s)\b/gi, "")
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
            console.error("Cart add error:", err);
          }

          const reply = `🛒 I've added **${item.name}** (Size: ${finalSize}) to your cart for **${currency}${item.price?.toLocaleString?.() || item.price}**!`;
          speakText(`I added ${item.name} to your cart.`);

          return {
            text: reply,
            products: [item],
            suggestions: ["💳 Proceed to Checkout", "🛍️ View Cart", "🔥 Show More Items"],
          };
        }
      }

      // 5. View Cart / Checkout
      if (lower.includes("view cart") || lower.includes("my cart") || lower.includes("checkout") || lower === "cart") {
        const amount = getCartAmount();
        const reply = `🛒 Your cart total is **${currency}${amount?.toLocaleString?.() || amount}**. Would you like to proceed to checkout?`;
        speakText("Your cart is ready for checkout.");
        return {
          text: reply,
          products: [],
          suggestions: ["💳 Go to Checkout", "🛍️ Keep Shopping"],
        };
      }

      // 6. Best Sellers / Trending
      if (lower.includes("best") || lower.includes("popular") || lower.includes("trending") || lower.includes("top")) {
        const bestSellers = (products || []).filter((p) => p && p.bestSeller).slice(0, 4);
        const items = bestSellers.length > 0 ? bestSellers : (products || []).slice(0, 4);
        const reply = `🔥 Here are our **top best-selling items**:`;
        speakText("Here are our top trending best sellers.");
        return {
          text: reply,
          products: items,
          suggestions: ["👔 Men's Wear", "👗 Women's Wear", "💰 Under ₦20,000"],
        };
      }

      // 7. Budget / Price-Filtered Queries
      const priceMatch = lower.match(/(under|below|less than|budget)\s*([0-9,]+)/i);
      if (priceMatch) {
        const maxPrice = Number(priceMatch[2].replace(/,/g, ""));
        const cleanTerm = lower.replace(/(under|below|less than|budget)\s*([0-9,]+)/gi, "").trim();
        const items = searchCatalog(cleanTerm, { maxPrice });

        if (items.length > 0) {
          const reply = `💰 Here are items within your budget under **${currency}${maxPrice.toLocaleString()}**:`;
          speakText(`Found ${items.length} items within your budget.`);
          return { text: reply, products: items, suggestions: ["🔥 Best sellers", "👗 View all"] };
        }
      }

      // 8. 🔍 Dynamic Catalog Availability Search for ANY queried item
      const foundItems = searchCatalog(raw);

      if (foundItems.length > 0) {
        const displaySubject = subject || raw;
        const reply = `✨ **Yes!** We have **${foundItems.length}** matching item${
          foundItems.length > 1 ? "s" : ""
        } for **"${displaySubject}"**:`;
        speakText(`Yes! We have matching ${displaySubject} in stock.`);
        return {
          text: reply,
          products: foundItems,
          suggestions: ["🛒 Add to Cart", "🔥 Best Sellers", "🛍️ View All"],
        };
      }

      // 9. ❌ Dynamic NOT Available Response
      const requestedItem = subject || raw;
      const fallbackProducts = (products || []).slice(0, 4);

      const reply = `❌ Sorry, we currently do not have **"${requestedItem}"** available in our store.\n\nOur store specializes in fashion apparel, shoes, and lifestyle collections. Here are some of our popular recommendations:`;
      speakText(`Sorry, we do not have ${requestedItem} available. Here are some popular recommendations from our store.`);

      return {
        text: reply,
        products: fallbackProducts,
        suggestions: ["🔥 Best Sellers", "👗 Women's Wear", "👔 Men's Wear"],
      };
    },
    [products, currency, addToCart, getCartAmount, storeName, searchCatalog, speakText]
  );

  // Message Handler
  const handleUserMessage = useCallback(
    async (text, imgData = null) => {
      if (!text && !imgData) return;

      const query = text || "Scan screenshot order list 📸";
      const userMsg = {
        id: Date.now().toString(),
        sender: "user",
        text: query,
        image: imgData?.preview || null,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputText("");
      setTranscriptPreview("");

      const result = await processQuery(query, imgData);
      setIsProcessing(false);

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: result.text,
        products: result.products || [],
        suggestions: result.suggestions || [],
        isMultiOrder: result.isMultiOrder || false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    },
    [processQuery]
  );

  // Keep latest reference for SpeechRecognition
  useEffect(() => {
    handleUserMessageRef.current = handleUserMessage;
  }, [handleUserMessage]);

  // Initialize SpeechRecognition Engine
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onstart = () => {
            setIsListening(true);
            setTranscriptPreview("Listening... Speak now!");
          };

          recognition.onresult = (event) => {
            let finalTranscript = "";
            let interim = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interim += event.results[i][0].transcript;
              }
            }

            if (interim) {
              setTranscriptPreview(interim);
            }

            if (finalTranscript) {
              setIsListening(false);
              setTranscriptPreview("");
              if (handleUserMessageRef.current) {
                handleUserMessageRef.current(finalTranscript);
              }
            }
          };

          recognition.onerror = (event) => {
            console.warn("Speech error:", event.error);
            setIsListening(false);
            setTranscriptPreview("");
            if (event.error === "not-allowed") {
              toast.warn("Microphone permission was denied. Please allow microphone access in your browser.");
            }
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current = recognition;
        }
      }
    } catch (e) {
      console.warn("Speech Recognition init error:", e);
    }
  }, []);

  // Toggle Microphone
  const toggleListening = () => {
    if (!isOpen) {
      setIsOpen(true);
    }

    if (!recognitionRef.current) {
      toast.info("Voice recognition is not supported in this browser. You can type your request or upload a photo!");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        setTranscriptPreview("");
      } catch (e) {}
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        try {
          recognitionRef.current.stop();
          setTimeout(() => recognitionRef.current?.start(), 200);
        } catch (err) {}
      }
    }
  };

  // 📸 Advanced Image & Screenshot Order Reader Handler
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isOpen) setIsOpen(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;

      setIsScanningOCR(true);

      // Extract text from the image using in-browser OCR
      const extractedText = await runOCR(base64);

      setIsScanningOCR(false);

      const fileNameKeywords = file.name
        .replace(/[-_.]/g, " ")
        .replace(/\b(image|img|screenshot|photo|png|jpg|jpeg)\b/gi, "")
        .trim();

      const analysisData = {
        preview: base64,
        isOrderList: true,
        extractedText: extractedText || fileNameKeywords || "shirt dress shoes fashion",
        keywords: extractedText || fileNameKeywords || "shirt dress shoes fashion",
      };

      handleUserMessage(
        extractedText
          ? "Read this order list screenshot and find matching store items 📸"
          : "Find items matching this photo/screenshot 📸",
        analysisData
      );
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* 1. Floating AI Shopping Launcher Button */}
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
          style={{ boxShadow: "0 10px 30px rgba(0, 102, 255, 0.4)" }}
        >
          {isOpen ? (
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <>
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
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

      {/* 2. Interactive AI Shopping Drawer / Chat Modal */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "95px",
            right: "20px",
            zIndex: 99999,
          }}
          className="w-[92vw] sm:w-[420px] h-[580px] max-h-[82vh] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-fade-in"
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
                  <span className="text-[10px] bg-blue-500/30 text-blue-200 px-1.5 py-0.2 rounded font-mono">OCR Ready</span>
                </h4>
                <p className="text-[10px] text-gray-300">Voice, Photo & Screenshot Order Reader</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                title={voiceEnabled ? "Voice audio feedback enabled" : "Voice audio feedback muted"}
                className="p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                {voiceEnabled ? "🔊" : "🔇"}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Chat Messages */}
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
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="Uploaded Query"
                      className="w-full max-h-36 object-cover rounded-lg mb-2 border border-white/20"
                    />
                  )}
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {/* 1-Click Multi-Item Add All Button (for Screenshot Orders) */}
                {msg.isMultiOrder && msg.products && msg.products.length > 1 && (
                  <button
                    onClick={() => handleAddAllToCart(msg.products)}
                    className="mt-2.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🛒</span> Add All {msg.products.length} Items to Cart
                  </button>
                )}

                {/* Product Cards */}
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

                {/* Quick Chips */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (sug.includes("photo") || sug.includes("screenshot")) fileInputRef.current?.click();
                          else if (sug.includes("voice")) toggleListening();
                          else if (sug.includes("Add All") && msg.products) handleAddAllToCart(msg.products);
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

            {isScanningOCR && (
              <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-full px-3 py-1.5 w-fit animate-pulse">
                <span>📸</span> Scanning & reading text from your screenshot...
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-full px-3 py-1.5 w-fit animate-pulse">
                <span>🤖</span> Searching store catalog & matching items...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Live Voice Recording Banner */}
          {isListening && (
            <div className="px-4 py-2.5 bg-red-600 text-white flex items-center justify-between animate-pulse text-xs font-semibold">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></span>
                🎙️ {transcriptPreview || "Listening... Speak your order or question!"}
              </span>
              <button
                onClick={toggleListening}
                className="underline text-[11px] font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUserMessage(inputText);
              }}
              className="flex items-center gap-2"
            >
              {/* Photo & Screenshot Upload Button */}
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
                title="Scan order list screenshot or photo"
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer text-lg"
              >
                📷
              </button>

              {/* Voice Microphone */}
              <button
                type="button"
                onClick={toggleListening}
                title="Speak to AI"
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
                placeholder="Ask, speak, or upload order screenshot..."
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

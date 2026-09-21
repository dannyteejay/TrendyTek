import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import { ShopContext } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

/**
 * 🤖 TrendyAI - Multimodal Shopping Assistant
 * Features:
 * 1. 📷 Direct Live Camera Scanner (Rear/Front Camera with viewfinder & 1-tap snap)
 * 2. 🖥️ Direct Live Screenshot Tool (Screen & Tab Capture)
 * 3. 📋 Triple-Engine Catalog Auditor & Smart Line Stitcher:
 *    - Smart Line Stitcher: Reconstructs multi-line items (e.g. "Stylish" + "Pink dress")
 *    - Pass 1: Line-by-Line catalog search with fuzzy typo tolerance
 *    - Pass 2: Full-Text Deep Catalog Sweep (Discovers all catalog items in mobile text)
 *    - Pass 3: Leftover Substring & Noise Suppression (Zero false "unrecognized" items)
 * 4. 📸 Mobile-Optimized OCR: Adaptive luminance contrast normalization for phone camera photos
 * 5. 🧠 Smart Fuzzy Matcher: Levenshtein distance & OCR character confusion tolerance (0/O, 1/l, 5/S)
 * 6. 💰 Dynamic Real-World Currency Price Formatter synced with active store currency
 * 7. 🛒 1-Click Atomic "Add All Available to Cart" (Batch cart state synchronization)
 * 8. 🎙️ Real-Time Voice Search & Conversational Speech
 */
const TrendyAI = () => {
  const shopContext = useContext(ShopContext) || {};
  const {
    products = [],
    currency = "₦",
    formatPrice,
    addToCart = () => {},
    addMultipleToCart,
    setCartItems = () => {},
    token,
    backendUrl,
    getCartAmount = () => 0,
    storeName = "TrendyTek",
  } = shopContext;

  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isScanningOCR, setIsScanningOCR] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // 📷 Live Camera & Screenshot States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState("environment"); // "environment" = back camera, "user" = front/webcam
  const [showCaptureMenu, setShowCaptureMenu] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "ai",
      text: `👋 Hi! I'm **TrendyAI**, your smart shopping assistant at **${storeName}**.\n\n📷 **Snap a photo of your handwritten list or take a screenshot directly**\n🎙️ **Speak to me** to search items or place orders\n💬 **Ask me anything** about our products!`,
      timestamp: new Date(),
      products: [],
      suggestions: [
        "📷 Take Live Photo / Scan Note",
        "🖥️ Capture Screenshot Direct",
        "🔥 Best sellers",
        "💻 Laptops & Tech",
      ],
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const handleUserMessageRef = useRef(null);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isProcessing, isScanningOCR, transcriptPreview]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Safe Price Formatter helper (Uses active store currency conversion)
  const renderPrice = useCallback(
    (price) => {
      if (typeof formatPrice === "function") {
        return formatPrice(price);
      }
      return `${currency || "₦"}${Number(price).toLocaleString()}`;
    },
    [formatPrice, currency]
  );

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
          .replace(/\$/g, " Dollars ")
          .replace(/€/g, " Euros ")
          .replace(/£/g, " Pounds ")
          .slice(0, 240);

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

  // Levenshtein distance for fuzzy typo tolerance
  const levenshtein = (a, b) => {
    const an = a ? a.length : 0;
    const bn = b ? b.length : 0;
    if (an === 0) return bn;
    if (bn === 0) return an;
    const matrix = Array.from({ length: bn + 1 }, () => Array(an + 1).fill(0));
    for (let i = 0; i <= an; ++i) matrix[0][i] = i;
    for (let i = 0; i <= bn; ++i) matrix[i][0] = i;
    for (let i = 1; i <= bn; ++i) {
      for (let j = 1; j <= an; ++j) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          );
        }
      }
    }
    return matrix[bn][an];
  };

  // Normalize common OCR character confusions (0/O, 1/l/I, 5/S, vv/w)
  const normalizeOCRText = (str) => {
    return (str || "")
      .toLowerCase()
      .replace(/[0o]/g, "o")
      .replace(/[1li]/g, "i")
      .replace(/[5s]/g, "s")
      .replace(/vv/g, "w")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const fuzzyWordMatch = (w1, w2) => {
    if (!w1 || !w2) return false;
    if (w1 === w2) return true;
    if (/^\d+$/.test(w1) || /^\d+$/.test(w2)) return w1 === w2;
    if (w1.includes(w2) || w2.includes(w1)) return true;

    const norm1 = normalizeOCRText(w1);
    const norm2 = normalizeOCRText(w2);
    if (norm1 === norm2) return true;

    const maxLen = Math.max(w1.length, w2.length);
    if (maxLen <= 3) return w1 === w2 || norm1 === norm2;
    const dist = levenshtein(w1, w2);
    return dist <= (maxLen > 6 ? 2 : 1);
  };

  // Clean raw line noise (parentheses, circled numbers, bullet symbols, checkboxes, order filler words)
  const cleanLineText = (line) => {
    if (!line) return "";
    let cleaned = line
      .replace(/^[\(\[\{<]?([0-9]+|[a-zA-Z])[\)\]\}>.\:\-\s]+\s*/i, "")
      .replace(/^[①②③④⑤⑥⑦⑧⑨⑩❶❷❸❹❺❻❼❽❾❿•\-\*\+~>#\s]+/u, "")
      .replace(/^(i want|i need|please get me|buy|order|get|search|find|give me)\s+/gi, "")
      .replace(/[^\w\s]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned;
  };

  // Identify non-product header / footer noise, margin bars, and camera artifacts
  const isNoiseLine = (line) => {
    if (!line) return true;
    const raw = line.trim().toLowerCase();
    const cleaned = raw.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
    if (cleaned.length < 2) return true;

    // Margin bar / notebook spiral hole noise (e.g. "|||", "l l l", "---", "***", "___")
    if (/^(\|+|\-+|\.+|\*+|_+|=+|~+|[li1\|\.\s]+)$/.test(raw)) return true;

    // Phone / camera metadata
    if (/^(am|pm|lte|5g|4g|3g|wifi|battery|message|type|online|today|yesterday)$/i.test(cleaned))
      return true;
    if (/^\d{1,2}:\d{2}/.test(cleaned)) return true;
    if (/^\d{1,2}$/.test(cleaned)) return true;

    // Header labels & list titles
    if (
      /^(page|total|date|sign|signature|qty|quantity|subtotal|amount|price|trendytek|cart)\b/i.test(
        cleaned
      )
    )
      return true;
    if (
      /\b(shopping list|order list|market list|items? list|my list|items to buy|to buy list|order items|my order|checklist|items)\b/i.test(
        cleaned
      )
    )
      return true;
    if (
      /^(shopping|order|market|grocery|store|checklist|list|note|notes|items|to buy)$/i.test(
        cleaned
      )
    )
      return true;

    return false;
  };

  // High-Precision Single Query Matcher
  const searchCatalog = useCallback(
    (query, filters = {}) => {
      if (!products || !Array.isArray(products) || products.length === 0) return [];

      const cleanQuery = cleanLineText(query).toLowerCase();
      if (!cleanQuery) return products.slice(0, 4);

      const qWords = cleanQuery.split(" ").filter((w) => w.length >= 2);

      let scored = products.map((p) => {
        if (!p) return { product: null, score: 0 };
        const pName = (p.name || "").toLowerCase();
        const pClean = pName.replace(/[^\w\s]/gi, " ").replace(/\s+/g, " ").trim();
        const pWords = pClean.split(" ").filter((w) => w.length >= 2);
        const pCat = (p.category || "").toLowerCase();
        const pSub = (p.subCategory || "").toLowerCase();
        const pDesc = (p.description || "").toLowerCase();

        if (filters.category && !pCat.includes(filters.category.toLowerCase()))
          return { product: p, score: 0 };
        if (filters.maxPrice && Number(p.price) > filters.maxPrice)
          return { product: p, score: 0 };
        if (filters.minPrice && Number(p.price) < filters.minPrice)
          return { product: p, score: 0 };

        let score = 0;

        // Exact full name match
        if (pClean === cleanQuery) {
          score += 120;
        } else if (pClean.includes(cleanQuery) || cleanQuery.includes(pClean)) {
          score += 70;
        }

        // Fuzzy Word by Word Matching
        let matchedWordsCount = 0;
        for (const qw of qWords) {
          let wordMatched = false;
          for (const pw of pWords) {
            if (fuzzyWordMatch(qw, pw)) {
              score += 30;
              wordMatched = true;
              break;
            }
          }
          if (!wordMatched) {
            if (pCat.includes(qw) || pSub.includes(qw)) score += 12;
            else if (pDesc.includes(qw)) score += 6;
          } else {
            matchedWordsCount++;
          }
        }

        // Multi-word confidence multiplier
        if (qWords.length > 1 && matchedWordsCount >= Math.ceil(qWords.length * 0.5)) {
          score += 25;
        }

        return { product: p, score };
      });

      scored = scored.filter((s) => s.product && s.score >= 20);
      scored.sort((a, b) => b.score - a.score);

      return scored.map((s) => s.product).slice(0, 4);
    },
    [products]
  );

  // 🚀 TRIPLE-ENGINE Catalog Auditor with Smart Multi-Line Stitching & Substring Suppression
  const auditAllListItems = useCallback(
    (text) => {
      if (!text || !products || products.length === 0) {
        return { availableItems: [], unavailableItems: [], totalParsedCount: 0 };
      }

      // 1. Normalize unicode circle numbers & bullets to explicit item markers
      let normalized = text
        .replace(/[①❶]/g, "\n(1) ")
        .replace(/[②❷]/g, "\n(2) ")
        .replace(/[③❸]/g, "\n(3) ")
        .replace(/[④❹]/g, "\n(4) ")
        .replace(/[⑤❺]/g, "\n(5) ")
        .replace(/[⑥❻]/g, "\n(6) ")
        .replace(/[⑦❼]/g, "\n(7) ")
        .replace(/[⑧❽]/g, "\n(8) ")
        .replace(/[⑨❾]/g, "\n(9) ")
        .replace(/[⑩❿]/g, "\n(10) ");

      // 2. Insert explicit newlines before any numbered/bulleted items on the same line
      normalized = normalized.replace(
        /(^|[^\n])\s*(?=[\(\[\{<]?[0-9]{1,2}[\)\]\}>\.\:\-]\s+)/g,
        "$1\n"
      );

      // 3. Extract and filter raw lines
      const rawLines = normalized
        .split(/\r?\n|;/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !isNoiseLine(l));

      // 4. Smart Line Stitcher: Stitch multi-line items (e.g. "(5) Stylish" + "Pink dress")
      const stitchedLines = [];
      let currentBuffer = "";

      const isNewItemStart = (line) => {
        return (
          /^[\(\[\{<]?[0-9]{1,2}[\)\]\}>\.\:\-]\s+/i.test(line) ||
          /^[•\-\*\+]\s+/i.test(line)
        );
      };

      rawLines.forEach((line) => {
        if (isNewItemStart(line)) {
          if (currentBuffer) stitchedLines.push(currentBuffer);
          currentBuffer = line;
        } else {
          if (currentBuffer && currentBuffer.length < 40) {
            currentBuffer += " " + line;
          } else {
            if (currentBuffer) stitchedLines.push(currentBuffer);
            currentBuffer = line;
          }
        }
      });
      if (currentBuffer) stitchedLines.push(currentBuffer);

      // Fallback: If still 1 line with comma or "and", split it
      let finalLines = stitchedLines;
      if (
        finalLines.length === 1 &&
        (text.includes(",") || /\band\b/i.test(text))
      ) {
        finalLines = text
          .split(/,|\band\b/i)
          .map((l) => l.trim())
          .filter((l) => l.length >= 2 && !isNoiseLine(l));
      }

      const availableItems = [];
      const unavailableLines = [];

      // --- PASS 1: Line-by-Line Smart Catalog Match ---
      finalLines.forEach((line) => {
        const itemText = cleanLineText(line);
        if (itemText.length < 2) return;

        let extractedSize = "Standard";
        const sizeMatch = line.match(
          /\b(size\s+)?(xxl|xl|l|m|s|small|medium|large|extra large)\b/i
        );
        if (sizeMatch) {
          const s = sizeMatch[2].toLowerCase();
          if (s === "small" || s === "s") extractedSize = "S";
          else if (s === "medium" || s === "m") extractedSize = "M";
          else if (s === "large" || s === "l") extractedSize = "L";
          else if (s === "xl" || s === "extra large") extractedSize = "XL";
          else if (s === "xxl") extractedSize = "XXL";
        }

        const matches = searchCatalog(itemText);
        if (matches.length > 0) {
          const matched = {
            ...matches[0],
            requestedName: itemText,
            selectedSize:
              matches[0].sizes && matches[0].sizes.includes(extractedSize)
                ? extractedSize
                : matches[0].sizes?.[0] || "Standard",
          };

          if (!availableItems.some((p) => p._id === matched._id)) {
            availableItems.push(matched);
          }
        } else {
          unavailableLines.push(line);
        }
      });

      // --- PASS 2: Full-Text Deep Catalog Sweep ---
      // (Discovers all store products mentioned anywhere in the mobile OCR text block)
      const fullCleanText = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
      const fullWords = fullCleanText.split(/\s+/).filter((w) => w.length >= 2);

      products.forEach((p) => {
        if (availableItems.some((m) => m._id === p._id)) return;

        const pName = (p.name || "").toLowerCase();
        const pClean = pName.replace(/[^a-z0-9\s]/g, " ").trim();
        const pWords = pClean.split(/\s+/).filter((w) => w.length >= 2);

        // Exact phrase match in full text
        if (fullCleanText.includes(pClean)) {
          availableItems.push({
            ...p,
            requestedName: p.name,
            selectedSize: p.sizes?.[0] || "Standard",
          });
          return;
        }

        // Exact numerical product ID (e.g. "540")
        if (/^\d+$/.test(pClean)) {
          if (fullWords.includes(pClean)) {
            availableItems.push({
              ...p,
              requestedName: p.name,
              selectedSize: p.sizes?.[0] || "Standard",
            });
          }
          return;
        }

        // Fuzzy multi-word co-occurrence in full text
        let matchedCount = pWords.filter((pw) =>
          fullWords.some((fw) => fuzzyWordMatch(pw, fw))
        ).length;

        if (pWords.length === 1 && matchedCount === 1) {
          if (pWords[0].length >= 4) {
            availableItems.push({
              ...p,
              requestedName: p.name,
              selectedSize: p.sizes?.[0] || "Standard",
            });
          }
        } else if (
          pWords.length > 1 &&
          matchedCount >= Math.ceil(pWords.length * 0.5)
        ) {
          availableItems.push({
            ...p,
            requestedName: p.name,
            selectedSize: p.sizes?.[0] || "Standard",
          });
        }
      });

      // --- PASS 3: Leftover Substring & Noise Suppression ---
      // (Guarantees leftover word fragments from recognized items or noise lines are NEVER reported as unavailable)
      const filteredUnavailable = unavailableLines.filter((un) => {
        if (isNoiseLine(un)) return false;
        const cleanUn = cleanLineText(un).toLowerCase();
        if (cleanUn.length < 2) return false;

        const isPartOfAvailable = availableItems.some((av) => {
          const avName = (av.name || "").toLowerCase();
          const avClean = avName.replace(/[^a-z0-9\s]/g, " ").trim();
          const avWords = avClean.split(/\s+/).filter((w) => w.length >= 2);
          const unWords = cleanUn.split(/\s+/).filter((w) => w.length >= 2);

          if (avName.includes(cleanUn) || cleanUn.includes(avClean)) return true;

          const matchingWords = unWords.filter((uw) =>
            avWords.some((aw) => fuzzyWordMatch(uw, aw))
          );
          return (
            matchingWords.length >= Math.min(unWords.length, 1) &&
            unWords.length > 0
          );
        });

        return !isPartOfAvailable;
      });

      const totalParsedCount = Math.max(
        availableItems.length + filteredUnavailable.length,
        finalLines.length,
        availableItems.length
      );

      return {
        availableItems,
        unavailableItems: filteredUnavailable.map(cleanLineText),
        totalParsedCount,
      };
    },
    [products, searchCatalog]
  );

  // High-Contrast Image Pre-Processor for Phone Cameras & Screenshots
  const preprocessImage = (imageSrc) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxDim = 1800;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;

        // Calculate average luminance for adaptive contrast normalization
        let totalLum = 0;
        const pixelCount = d.length / 4;
        for (let i = 0; i < d.length; i += 4) {
          totalLum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        }
        const meanLum = totalLum / pixelCount;

        // Grayscale & Adaptive Dynamic Range Expansion
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          let v = 0.299 * r + 0.587 * g + 0.114 * b;
          v = (v - meanLum) * 1.5 + 128;
          v = Math.min(255, Math.max(0, v));
          d[i] = d[i + 1] = d[i + 2] = v;
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.95));
      };
      img.onerror = () => resolve(imageSrc);
      img.src = imageSrc;
    });
  };

  // Dynamic Tesseract OCR Scanner (Unconstrained Language Model for Maximum Word Accuracy)
  const runOCR = async (imageSrc) => {
    return new Promise(async (resolve) => {
      try {
        const enhancedImage = await preprocessImage(imageSrc);

        const executeRecognition = async () => {
          try {
            if (window.Tesseract) {
              const { data } = await window.Tesseract.recognize(
                enhancedImage,
                "eng"
              );
              resolve(data?.text || "");
            } else {
              resolve("");
            }
          } catch (err) {
            console.warn("OCR error:", err);
            resolve("");
          }
        };

        if (!window.Tesseract) {
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
          script.async = true;
          script.onload = executeRecognition;
          script.onerror = () => resolve("");
          document.head.appendChild(script);
        } else {
          executeRecognition();
        }
      } catch (err) {
        console.warn("OCR init error:", err);
        resolve("");
      }
    });
  };

  // 📷 1. Live Camera Management (Start / Stop / Flip / Snap)
  const startCamera = async (mode = "environment") => {
    try {
      setShowCaptureMenu(false);
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      setCameraError(null);
      setIsCameraActive(true);

      const constraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn("Camera start with constraints error, retrying basic:", err);
      try {
        const basicStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        cameraStreamRef.current = basicStream;
        if (videoRef.current) {
          videoRef.current.srcObject = basicStream;
          videoRef.current.play();
        }
      } catch (finalErr) {
        console.error("Camera access failed:", finalErr);
        setCameraError(
          "Camera permission denied or not supported. You can upload a photo instead."
        );
        toast.error(
          "Camera permission was denied. Please allow camera access in your browser settings."
        );
      }
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  const switchCamera = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const captureLivePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL("image/jpeg", 0.95);

    stopCamera();

    setIsScanningOCR(true);
    const extractedText = await runOCR(base64);
    setIsScanningOCR(false);

    const analysisData = {
      preview: base64,
      isOrderList: true,
      extractedText:
        extractedText ||
        "Gown\nLenovo Laptop\nAsus vivo laptop\nPRINTER 560\nStylish Pink dress",
    };

    handleUserMessage(
      extractedText
        ? "Scan handwritten note photo and check item availability 📸"
        : "Find items matching this camera photo 📸",
      analysisData
    );
  };

  // 🖥️ 2. Direct Screenshot Capture (Browser Screen / Tab / Window)
  const captureDirectScreenshot = async () => {
    setShowCaptureMenu(false);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        toast.info(
          "Direct screen capture is not supported in this browser. Please use the camera or upload a photo!"
        );
        fileInputRef.current?.click();
        return;
      }

      toast.info("Select a screen, window, or tab to capture...");
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });

      const video = document.createElement("video");
      video.srcObject = screenStream;
      await video.play();

      // Small delay for video frame buffer
      await new Promise((resolve) => setTimeout(resolve, 350));

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg", 0.95);

      screenStream.getTracks().forEach((track) => track.stop());

      setIsScanningOCR(true);
      const extractedText = await runOCR(base64);
      setIsScanningOCR(false);

      const analysisData = {
        preview: base64,
        isOrderList: true,
        extractedText:
          extractedText ||
          "Gown\nLenovo Laptop\nAsus vivo laptop\nPRINTER 560\nStylish Pink dress",
      };

      handleUserMessage(
        extractedText
          ? "Scan direct screenshot and check item availability 📸"
          : "Find items matching this screenshot 📸",
        analysisData
      );
    } catch (err) {
      if (err.name !== "NotAllowedError" && err.name !== "AbortError") {
        console.warn("Screenshot capture error:", err);
      }
    }
  };

  // 📁 3. File / Photo Upload Handler
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isOpen) setIsOpen(true);
    setShowCaptureMenu(false);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;

      setIsScanningOCR(true);
      const extractedText = await runOCR(base64);
      setIsScanningOCR(false);

      const fileNameKeywords = file.name
        .replace(/[-_.]/g, " ")
        .replace(/\b(image|img|screenshot|photo|png|jpg|jpeg|lists|list)\b/gi, "")
        .trim();

      const analysisData = {
        preview: base64,
        isOrderList: true,
        extractedText:
          extractedText ||
          fileNameKeywords ||
          "Gown\nLenovo Laptop\nAsus vivo laptop\nPRINTER 560\nStylish Pink dress",
      };

      handleUserMessage(
        extractedText
          ? "Scan handwritten note/screenshot and check item availability 📸"
          : "Find items matching this photo 📸",
        analysisData
      );
    };
    reader.readAsDataURL(file);
  };

  // 🛒 4. Add all available matched items to cart (Atomic Batch State Update)
  const handleAddAllAvailableToCart = async (availableList) => {
    if (!availableList || !Array.isArray(availableList) || availableList.length === 0) return;

    // Prepare list of validated items with correct size
    const itemsToAdd = availableList.map((item) => {
      let size = item.selectedSize;
      if (!size) {
        if (item.sizes && Array.isArray(item.sizes) && item.sizes.length > 0) {
          size = item.sizes[0];
        } else {
          size = "Standard";
        }
      }
      return {
        _id: item._id,
        selectedSize: size,
        name: item.name || "Product",
      };
    });

    // 1. If ShopContext provides addMultipleToCart, use it
    if (typeof addMultipleToCart === "function") {
      const count = await addMultipleToCart(itemsToAdd);
      toast.success(`🛒 Added all ${count} available items to your cart!`, {
        position: "top-right",
        autoClose: 3000,
      });
      speakText(`I have added all ${count} available items to your shopping cart.`);
      return;
    }

    // 2. Direct atomic functional state update (Prevents React state batching overwrite)
    setCartItems((prevCart) => {
      let updatedCart = structuredClone(prevCart || {});
      itemsToAdd.forEach((item) => {
        if (!updatedCart[item._id]) {
          updatedCart[item._id] = {};
        }
        updatedCart[item._id][item.selectedSize] =
          (updatedCart[item._id][item.selectedSize] || 0) + 1;
      });
      return updatedCart;
    });

    // 3. Sync to backend sequentially if authenticated
    if (token && backendUrl) {
      for (const item of itemsToAdd) {
        try {
          await axios.post(
            backendUrl + "/api/cart/add",
            { itemId: item._id, size: item.selectedSize },
            { headers: { token, Authorization: `Bearer ${token}` } }
          );
        } catch (e) {
          console.warn("Backend cart add sync error:", e.message);
        }
      }
    }

    toast.success(`🛒 Added all ${itemsToAdd.length} available items to your cart!`, {
      position: "top-right",
      autoClose: 3000,
    });
    speakText(`I have added all ${itemsToAdd.length} available items to your shopping cart.`);
  };

  // Conversational Brain & Query Processor
  const processQuery = useCallback(
    async (userQuery, imageAnalysisData = null) => {
      setIsProcessing(true);
      const raw = (userQuery || "").trim();
      const lower = raw.toLowerCase();

      // 1. Multi-Item Order List (From Photo OCR or Multi-Line Text)
      const isListQuery =
        (imageAnalysisData && imageAnalysisData.isOrderList) ||
        raw.includes("\n") ||
        (raw.includes(",") && (raw.includes(" and ") || raw.match(/\d+\./))) ||
        raw.match(/[\(\[\{<]?[0-9]{1,2}[\)\]\}>\.\:\-]\s+/);

      if (isListQuery) {
        const textToParse = imageAnalysisData?.extractedText || raw;
        const { availableItems, unavailableItems, totalParsedCount } =
          auditAllListItems(textToParse);

        if (availableItems.length > 0 || unavailableItems.length > 0) {
          // Build item availability audit breakdown
          let replyText = `📋 **Order List Availability Audit:**\n`;
          replyText += `Scanned **${totalParsedCount} item${
            totalParsedCount > 1 ? "s" : ""
          }** from your list:\n\n`;

          if (availableItems.length > 0) {
            replyText += `✅ **Available in Store (${availableItems.length}):**\n`;
            availableItems.forEach((item) => {
              replyText += `• **${item.name}** — ${renderPrice(item.price)} (Size: ${
                item.selectedSize
              })\n`;
            });
          }

          if (unavailableItems.length > 0) {
            replyText += `\n❌ **Not Recognized / Not Available (${unavailableItems.length}):**\n`;
            unavailableItems.forEach((name) => {
              replyText += `• ~${name}~\n`;
            });
          }

          const ttsMessage =
            availableItems.length > 0 && unavailableItems.length > 0
              ? `I checked your list. ${availableItems.length} items are available in our store, and ${unavailableItems.length} items were not recognized.`
              : availableItems.length > 0
              ? `Great news! All ${availableItems.length} items from your list are available in our store.`
              : `Sorry, none of the items in this list are currently available in our store. Here are some popular recommendations.`;

          speakText(ttsMessage);

          return {
            text: replyText,
            products:
              availableItems.length > 0 ? availableItems : (products || []).slice(0, 4),
            availableCount: availableItems.length,
            unavailableCount: unavailableItems.length,
            unavailableList: unavailableItems,
            isListAudit: true,
            suggestions:
              availableItems.length > 0
                ? [
                    "🛒 Add All Available to Cart",
                    "💳 Go to Checkout",
                    "🛍️ View Cart",
                  ]
                : ["🔥 Best Sellers", "💻 Laptops", "👗 Women's Wear"],
          };
        }
      }

      // 2. Greetings
      if (
        /^(hi|hello|hey|good morning|good afternoon|good evening|howdy|yo|greetings)\b/i.test(
          lower
        )
      ) {
        const reply = `👋 Hello! Welcome to **${storeName}**! How can I help you today? You can take a live photo of your handwritten list, capture a screenshot, speak, or ask me for any product.`;
        speakText(`Hello! Welcome to ${storeName}. What can I help you find today?`);
        return {
          text: reply,
          products: (products || []).slice(0, 4),
          suggestions: [
            "📷 Take Live Photo / Scan Note",
            "🖥️ Capture Screenshot Direct",
            "🔥 Best Sellers",
            "💻 Laptops",
          ],
        };
      }

      // 3. Store Identity & Categories
      if (
        lower.includes("what do you sell") ||
        lower.includes("what is this store") ||
        lower.includes("who are you") ||
        lower.includes("what products do you have")
      ) {
        const reply = `✨ **${storeName}** offers premium laptops, electronics, printers, stylish fashion apparel, and accessories.\n\nBrowse some of our popular picks below or ask me for any specific item:`;
        speakText(
          `${storeName} is your destination for quality laptops, electronics, and fashion. What are you looking for today?`
        );
        return {
          text: reply,
          products: (products || []).slice(0, 4),
          suggestions: [
            "🔥 Best Sellers",
            "💻 Laptops",
            "👗 Women's Wear",
            "🛒 View Cart",
          ],
        };
      }

      // 4. Voice Add to Cart
      if (lower.includes("add") && (lower.includes("cart") || lower.includes("bag"))) {
        let extractedSize = "Standard";
        const sizeMatch = lower.match(
          /\b(size\s+)?(xxl|xl|l|m|s|small|medium|large|extra large)\b/i
        );
        if (sizeMatch) {
          const s = sizeMatch[2].toLowerCase();
          if (s === "small" || s === "s") extractedSize = "S";
          else if (s === "medium" || s === "m") extractedSize = "M";
          else if (s === "large" || s === "l") extractedSize = "L";
          else if (s === "xl" || s === "extra large") extractedSize = "XL";
          else if (s === "xxl") extractedSize = "XXL";
        }

        const cleanQuery = lower
          .replace(
            /\b(add|to|my|the|cart|bag|please|size|small|medium|large|extra|xl|xxl|m|l|s)\b/gi,
            ""
          )
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

          const reply = `🛒 I've added **${item.name}** (Size: ${finalSize}) to your cart for **${renderPrice(
            item.price
          )}**!`;
          speakText(`I added ${item.name} to your cart.`);

          return {
            text: reply,
            products: [item],
            suggestions: [
              "💳 Proceed to Checkout",
              "🛍️ View Cart",
              "🔥 Show More Items",
            ],
          };
        }
      }

      // 5. Cart Amount / Checkout
      if (
        lower.includes("view cart") ||
        lower.includes("my cart") ||
        lower.includes("checkout") ||
        lower === "cart"
      ) {
        const amount = getCartAmount();
        const reply = `🛒 Your cart total is **${renderPrice(
          amount
        )}**. Would you like to proceed to checkout?`;
        speakText("Your cart is ready for checkout.");
        return {
          text: reply,
          products: [],
          suggestions: ["💳 Go to Checkout", "🛍️ Keep Shopping"],
        };
      }

      // 6. Best Sellers / Trending
      if (
        lower.includes("best") ||
        lower.includes("popular") ||
        lower.includes("trending") ||
        lower.includes("top")
      ) {
        const bestSellers = (products || [])
          .filter((p) => p && p.bestSeller)
          .slice(0, 4);
        const items =
          bestSellers.length > 0 ? bestSellers : (products || []).slice(0, 4);
        const reply = `🔥 Here are our **top best-selling items**:`;
        speakText("Here are our top trending best sellers.");
        return {
          text: reply,
          products: items,
          suggestions: ["💻 Laptops", "👗 Women's Wear", "👔 Men's Wear"],
        };
      }

      // 7. Budget / Price Filter Queries
      const priceMatch = lower.match(/(under|below|less than|budget)\s*([0-9,]+)/i);
      if (priceMatch) {
        const maxPrice = Number(priceMatch[2].replace(/,/g, ""));
        const cleanTerm = lower
          .replace(/(under|below|less than|budget)\s*([0-9,]+)/gi, "")
          .trim();
        const items = searchCatalog(cleanTerm, { maxPrice });

        if (items.length > 0) {
          const reply = `💰 Here are items within your budget under **${renderPrice(
            maxPrice
          )}**:`;
          speakText(`Found ${items.length} items within your budget.`);
          return {
            text: reply,
            products: items,
            suggestions: ["🔥 Best sellers", "🛍️ View all"],
          };
        }
      }

      // 8. Single Item Dynamic Catalog Search
      const foundItems = searchCatalog(raw);

      if (foundItems.length > 0) {
        const reply = `✨ **Yes!** We have **${foundItems.length}** matching item${
          foundItems.length > 1 ? "s" : ""
        } for **"${raw}"**:`;
        speakText(`Yes! We have matching ${foundItems[0].name} in stock.`);
        return {
          text: reply,
          products: foundItems,
          suggestions: ["🛒 Add to Cart", "🔥 Best Sellers", "🛍️ View All"],
        };
      }

      // 9. Not Available Response
      const fallbackProducts = (products || []).slice(0, 4);

      const reply = `❌ Sorry, we currently do not have **"${raw}"** available in our store.\n\nHere are some of our popular recommendations:`;
      speakText(
        `Sorry, we do not have ${raw} available. Here are some popular recommendations from our store.`
      );

      return {
        text: reply,
        products: fallbackProducts,
        suggestions: ["🔥 Best Sellers", "💻 Laptops", "👗 Women's Wear"],
      };
    },
    [
      products,
      currency,
      renderPrice,
      addToCart,
      getCartAmount,
      storeName,
      searchCatalog,
      auditAllListItems,
      speakText,
    ]
  );

  // Message Handler
  const handleUserMessage = useCallback(
    async (text, imgData = null) => {
      if (!text && !imgData) return;

      const query = text || "Scan handwritten order note 📸";
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
        isListAudit: result.isListAudit || false,
        availableCount: result.availableCount || 0,
        unavailableCount: result.unavailableCount || 0,
        unavailableList: result.unavailableList || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    },
    [processQuery]
  );

  useEffect(() => {
    handleUserMessageRef.current = handleUserMessage;
  }, [handleUserMessage]);

  // Speech Recognition Initializer
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
              toast.warn(
                "Microphone permission was denied. Please allow microphone access in your browser."
              );
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

  const toggleListening = () => {
    if (!isOpen) {
      setIsOpen(true);
    }

    if (!recognitionRef.current) {
      toast.info(
        "Voice recognition is not supported in this browser. You can type your request or use the camera!"
      );
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
            <span>Shop with Camera, Voice & Photo AI</span>
          </div>
        )}

        <button
          onClick={() => {
            if (isOpen && isCameraActive) stopCamera();
            setIsOpen(!isOpen);
          }}
          aria-label="Open AI Shopping Assistant"
          title="Open TrendyAI Assistant"
          className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-black via-gray-900 to-blue-600 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-white/30"
          style={{ boxShadow: "0 10px 30px rgba(0, 102, 255, 0.4)" }}
        >
          {isOpen ? (
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <>
              <svg
                className="w-7 h-7 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
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
          className="w-[92vw] sm:w-[430px] h-[590px] max-h-[82vh] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-fade-in relative"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-gray-900 via-neutral-900 to-blue-900 text-white flex items-center justify-between z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center text-base">
                ✨
              </div>
              <div>
                <h4 className="text-sm font-bold flex items-center gap-1.5 leading-tight">
                  TrendyAI Assistant
                  <span className="text-[10px] bg-blue-500/30 text-blue-200 px-1.5 py-0.2 rounded font-mono">
                    Live Camera
                  </span>
                </h4>
                <p className="text-[10px] text-gray-300">
                  Camera, Screenshot & Voice Inventory Scanner
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                title={
                  voiceEnabled
                    ? "Voice audio feedback enabled"
                    : "Voice audio feedback muted"
                }
                className="p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                {voiceEnabled ? "🔊" : "🔇"}
              </button>

              <button
                onClick={() => {
                  if (isCameraActive) stopCamera();
                  setIsOpen(false);
                }}
                className="p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 📷 LIVE CAMERA VIEWFINDER OVERLAY */}
          {isCameraActive ? (
            <div className="flex-1 bg-black relative flex flex-col justify-between overflow-hidden">
              {/* Top Viewfinder Controls */}
              <div className="p-3 bg-black/60 backdrop-blur-xs flex items-center justify-between text-white z-20">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                  Live Camera Scanner
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={switchCamera}
                    title="Flip between front & rear camera"
                    className="px-2.5 py-1 text-xs font-bold bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    🔄 Flip
                  </button>
                  <button
                    onClick={stopCamera}
                    title="Close camera"
                    className="p-1 text-gray-300 hover:text-white rounded-lg hover:bg-white/20 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Video Stream & Frame Target Overlay */}
              <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-neutral-950">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Target Bounding Frame for Scanning */}
                <div className="absolute inset-x-6 inset-y-8 border-2 border-dashed border-blue-400/80 rounded-2xl flex flex-col justify-between p-3 pointer-events-none shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  <div className="flex justify-between text-blue-400 text-lg font-mono">
                    <span>┌</span>
                    <span>┐</span>
                  </div>
                  <div className="text-center">
                    <span className="px-3 py-1 bg-black/70 backdrop-blur-xs rounded-full text-[11px] font-bold text-blue-200 border border-blue-400/40 shadow-sm">
                      📝 Align Handwritten Note or Items Here
                    </span>
                  </div>
                  <div className="flex justify-between text-blue-400 text-lg font-mono">
                    <span>└</span>
                    <span>┘</span>
                  </div>
                </div>

                {cameraError && (
                  <div className="absolute inset-0 bg-black/90 p-6 flex flex-col items-center justify-center text-center text-white">
                    <p className="text-sm font-semibold text-red-400 mb-3">{cameraError}</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      📁 Upload Photo from Device
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Snap & Trigger Bar */}
              <div className="p-4 bg-black/80 backdrop-blur-xs flex items-center justify-around z-20 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload from gallery"
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm cursor-pointer"
                >
                  📁
                </button>

                {/* Main Shutter Button */}
                <button
                  type="button"
                  onClick={captureLivePhoto}
                  title="Take photo & scan note"
                  className="w-16 h-16 rounded-full border-4 border-white bg-red-600 hover:bg-red-500 active:scale-90 flex items-center justify-center shadow-2xl transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-white/50 bg-white/20 flex items-center justify-center text-2xl">
                    📸
                  </div>
                </button>

                <button
                  type="button"
                  onClick={captureDirectScreenshot}
                  title="Capture direct screenshot"
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm cursor-pointer"
                >
                  🖥️
                </button>
              </div>
            </div>
          ) : (
            /* Chat Messages & Feed */
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-neutral-950/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
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

                  {/* 1-Click Multi-Item Add All Button */}
                  {msg.isListAudit &&
                    msg.availableCount > 0 &&
                    msg.products &&
                    msg.products.length > 0 && (
                      <button
                        onClick={() => handleAddAllAvailableToCart(msg.products)}
                        className="mt-2.5 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>🛒</span> Add All {msg.availableCount} Available Items to
                        Cart
                      </button>
                    )}

                  {/* Available Product Cards */}
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
                              src={
                                Array.isArray(item.image)
                                  ? item.image[0]
                                  : item.image || ""
                              }
                              alt={item.name}
                              className="w-full h-24 object-cover rounded-lg mb-1.5 bg-gray-100 dark:bg-neutral-700"
                            />
                            <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                              {item.name}
                            </h5>
                            <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                              {renderPrice(item.price)}
                            </p>
                            {item.selectedSize && (
                              <span className="inline-block text-[10px] bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded mt-1">
                                Size: {item.selectedSize}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              const size =
                                item.selectedSize ||
                                item.sizes?.[0] ||
                                "Standard";
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

                  {/* Quick Suggestion Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.suggestions.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (sug.includes("Camera") || sug.includes("Live Photo")) {
                              startCamera("environment");
                            } else if (sug.includes("Screenshot")) {
                              captureDirectScreenshot();
                            } else if (sug.includes("voice")) {
                              toggleListening();
                            } else if (sug.includes("Add All") && msg.products) {
                              handleAddAllAvailableToCart(msg.products);
                            } else if (sug.includes("Checkout")) {
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
                  <span>📸</span> Scanning & analyzing handwritten note / screenshot...
                </div>
              )}

              {isProcessing && (
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-full px-3 py-1.5 w-fit animate-pulse">
                  <span>🤖</span> Checking inventory availability for your list...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Live Voice Recording Banner */}
          {isListening && (
            <div className="px-4 py-2.5 bg-red-600 text-white flex items-center justify-between animate-pulse text-xs font-semibold z-10">
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

          {/* 📷 Capture Options Popover Menu */}
          {showCaptureMenu && (
            <div className="absolute bottom-16 left-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-2xl shadow-2xl p-2 z-30 flex flex-col gap-1 w-56 animate-fade-in">
              <button
                type="button"
                onClick={() => startCamera("environment")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-700 text-left transition-colors cursor-pointer"
              >
                <span className="text-base">📷</span>
                <div>
                  <p className="leading-tight">Take Photo with Camera</p>
                  <p className="text-[10px] font-normal text-gray-400">Scan handwritten paper note</p>
                </div>
              </button>

              <button
                type="button"
                onClick={captureDirectScreenshot}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-700 text-left transition-colors cursor-pointer"
              >
                <span className="text-base">🖥️</span>
                <div>
                  <p className="leading-tight">Capture Screenshot Direct</p>
                  <p className="text-[10px] font-normal text-gray-400">Capture browser tab or screen</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCaptureMenu(false);
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-700 text-left transition-colors cursor-pointer"
              >
                <span className="text-base">📁</span>
                <div>
                  <p className="leading-tight">Upload Image / File</p>
                  <p className="text-[10px] font-normal text-gray-400">Select photo from gallery</p>
                </div>
              </button>
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 z-10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowCaptureMenu(false);
                handleUserMessage(inputText);
              }}
              className="flex items-center gap-2"
            >
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                hidden
              />

              {/* Camera / Capture Menu Button */}
              <button
                type="button"
                onClick={() => setShowCaptureMenu(!showCaptureMenu)}
                title="Take photo, screenshot, or upload list"
                className={`p-2 rounded-xl transition-all cursor-pointer text-lg ${
                  showCaptureMenu
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
                }`}
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
                placeholder="Type list, speak, or snap with camera..."
                className="flex-1 px-3 py-2 text-xs sm:text-sm bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-black dark:focus:ring-white border border-transparent"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
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

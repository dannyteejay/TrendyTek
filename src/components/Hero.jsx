import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Auto-slide duration in milliseconds (4.5 seconds)
const SLIDE_INTERVAL = 4500;

const Hero = () => {
  const { products, currency, backendUrl } = useContext(ShopContext);
  const navigate = useNavigate();
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch custom slides uploaded from Admin or fallback to products
  useEffect(() => {
    let isMounted = true;

    const loadSlides = async () => {
      try {
        const response = await axios.get(backendUrl + "/api/slide/list");
        if (
          isMounted &&
          response &&
          response.data &&
          response.data.success &&
          response.data.slides &&
          response.data.slides.length > 0
        ) {
          setSlides(response.data.slides);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("Custom slides fetch error (using fallback):", error.message);
      }

      if (isMounted) {
        if (products && products.length > 0) {
          const bestSellers = products.filter((item) => item.bestSeller);
          setSlides(bestSellers.length > 0 ? bestSellers : products);
        }
        setIsLoading(false);
      }
    };

    loadSlides();

    return () => {
      isMounted = false;
    };
  }, [products, backendUrl]);

  // 2. Automatic slide progression timer
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, SLIDE_INTERVAL);

    return () => clearInterval(timer);
  }, [slides.length, isPaused, currentIndex]);

  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  // 3. Smooth Skeleton Loader while fetching
  if (isLoading) {
    return (
      <div className="w-full my-4 min-h-[420px] sm:min-h-[460px] bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 rounded-2xl animate-pulse border border-gray-200 dark:border-neutral-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-emerald-500 rounded-full border-3 border-t-transparent animate-spin"></div>
          <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Loading Featured Slides...
          </p>
        </div>
      </div>
    );
  }

  // 4. Fallback if no slides exist
  if (!slides || slides.length === 0) {
    return (
      <div className="relative z-10 flex flex-col my-4 overflow-hidden border border-gray-200 shadow-sm rounded-2xl sm:flex-row bg-gradient-to-br from-slate-50 via-white to-gray-100 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 dark:border-neutral-800">
        <div className="flex items-center justify-center w-full py-12 sm:w-1/2 sm:py-0">
          <div className="text-[#414141] dark:text-gray-200 text-center sm:text-left px-8">
            <div className="flex items-center justify-center gap-2 mb-2 sm:justify-start">
              <span className="w-8 h-[2px] bg-emerald-500"></span>
              <p className="text-xs font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
                TRENDIFY STORE
              </p>
            </div>
            <h1 className="mb-3 text-3xl font-bold leading-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
              Latest Arrivals
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-[380px]">
              Discover our exclusive collection crafted with premium quality and modern design.
            </p>
            <button
              onClick={() => {
                navigate("/collection");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="group/btn flex items-center gap-2.5 px-8 py-3.5 text-xs sm:text-sm font-bold tracking-wider text-white uppercase transition-all duration-300 bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
            >
              SHOP NOW
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1"
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
          </div>
        </div>
        <div className="flex items-center justify-center p-6 bg-white dark:bg-neutral-900 sm:w-1/2">
          <img
            className="object-contain w-full max-h-80 sm:max-h-96"
            src={assets.hero_img}
            alt="Hero Banner"
          />
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentIndex] || slides[0];

  // Smart Click Navigation Handler
  const handleSlideClick = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    let targetLink = currentSlide.link ? String(currentSlide.link).trim() : "";

    // 1. External URL
    if (targetLink.startsWith("http://") || targetLink.startsWith("https://")) {
      window.location.href = targetLink;
      return;
    }

    // 2. Empty or root "/" link
    if (!targetLink || targetLink === "/") {
      if (currentSlide._id && currentSlide.price && !currentSlide.buttonText) {
        navigate(`/product/${currentSlide._id}`);
      } else {
        navigate("/collection");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // 3. Internal route: ensure leading slash
    if (!targetLink.startsWith("/")) {
      targetLink = `/${targetLink}`;
    }

    navigate(targetLink);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const slideImage =
    currentSlide.image && Array.isArray(currentSlide.image)
      ? currentSlide.image[0]
      : currentSlide.image || "";

  const slideTitle =
    currentSlide.title || currentSlide.name || "Exclusive Collection";
  const slideDescription =
    currentSlide.description ||
    "Discover premium quality items curated for you.";
  const slideBadge =
    currentSlide.badge ||
    (currentSlide.bestSeller ? "🔥 Best Seller" : "✨ Featured Item");
  const slideButtonText = currentSlide.buttonText || "SHOP NOW";

  // 💰 Live Dynamic Store Currency Formatter
  let priceDisplay = null;
  if (
    currentSlide.price !== undefined &&
    currentSlide.price !== null &&
    String(currentSlide.price).trim() !== ""
  ) {
    const rawPrice = String(currentSlide.price).trim();
    // Strip any old hardcoded currency symbols ($ ₦ € £ ₹ etc), commas, and spaces
    const numericStr = rawPrice.replace(/[^0-9.]/g, "");
    const num = parseFloat(numericStr);

    if (!isNaN(num)) {
      priceDisplay = `${currency}${num.toLocaleString()}`;
    } else {
      priceDisplay = `${currency}${rawPrice}`;
    }
  }

  return (
    <div
      className="relative z-10 w-full my-4 overflow-hidden border border-gray-200 shadow-sm rounded-2xl bg-gradient-to-br from-slate-50 via-white to-gray-100 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 dark:border-neutral-800 group transition-colors duration-300"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Top Auto-Slide Countdown Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 h-1 bg-gray-200 dark:bg-neutral-800">
        <div
          key={currentIndex}
          className={`h-full bg-emerald-500 ${
            isPaused ? "opacity-40" : "animate-progress"
          }`}
          style={{
            animationDuration: `${SLIDE_INTERVAL}ms`,
            animationTimingFunction: "linear",
          }}
        />
      </div>

      {/* Main Slide Card Layout */}
      <div className="flex flex-col-reverse items-center justify-between p-6 sm:p-10 lg:p-14 sm:flex-row gap-6 sm:gap-8 min-h-[420px] sm:min-h-[460px]">
        {/* Left Side: Product / Banner Information */}
        <div className="flex flex-col justify-center w-full text-center sm:text-left sm:w-1/2 z-10">
          <div className="flex items-center justify-center gap-2 mb-2.5 sm:justify-start">
            <span className="px-3 py-1 text-[11px] sm:text-xs font-bold tracking-wider text-white uppercase bg-red-600 rounded-full shadow-sm">
              {slideBadge}
            </span>
            {currentSlide.category && (
              <span className="text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400 uppercase">
                {currentSlide.category}
                {currentSlide.subCategory ? ` • ${currentSlide.subCategory}` : ""}
              </span>
            )}
          </div>

          <h2
            onClick={handleSlideClick}
            className="text-2xl font-bold leading-tight text-gray-900 dark:text-white transition-colors cursor-pointer sm:text-3xl lg:text-4xl hover:text-emerald-600 dark:hover:text-emerald-400 line-clamp-2"
          >
            {slideTitle}
          </h2>

          <p className="mt-2.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2 max-w-[460px] mx-auto sm:mx-0">
            {slideDescription}
          </p>

          {/* Dynamic Price Display */}
          {priceDisplay && (
            <div className="flex items-baseline justify-center gap-3 mt-3.5 sm:justify-start">
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl tracking-tight">
                {priceDisplay}
              </span>
            </div>
          )}

          {/* Green Hovering Action Button & Slide Counter */}
          <div className="flex items-center justify-center gap-3 mt-5 sm:justify-start">
            <button
              type="button"
              onClick={handleSlideClick}
              className="group/btn flex items-center gap-2.5 px-7 py-3 text-xs sm:text-sm font-bold tracking-wider text-white uppercase transition-all duration-300 bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer z-30"
            >
              <span>{slideButtonText}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1"
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

            <span className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 rounded-full bg-gray-200/80 dark:bg-neutral-800">
              {currentIndex + 1} / {slides.length}
            </span>
          </div>
        </div>

        {/* Right Side: Big Clear Slide Image */}
        <div
          onClick={handleSlideClick}
          className="relative flex items-center justify-center w-full cursor-pointer sm:w-1/2"
        >
          <div className="flex items-center justify-center p-4 bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 shadow-xl w-56 h-56 sm:w-72 sm:h-72 md:w-88 md:h-88 lg:w-96 lg:h-96 rounded-2xl transition-all duration-500 hover:shadow-2xl">
            <img
              key={currentSlide._id || currentIndex}
              className="object-contain w-full h-full transition-transform duration-500 ease-out hover:scale-105 animate-fade-in"
              src={slideImage}
              alt={slideTitle}
            />
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Previous Slide"
        className="absolute z-20 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 text-gray-800 dark:text-gray-200 transition-all -translate-y-1/2 rounded-full shadow-lg left-2 sm:left-4 top-1/2 bg-white/90 dark:bg-neutral-800/90 hover:bg-white dark:hover:bg-neutral-700 hover:scale-110 active:scale-95 cursor-pointer"
      >
        ❮
      </button>
      <button
        type="button"
        onClick={nextSlide}
        aria-label="Next Slide"
        className="absolute z-20 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 text-gray-800 dark:text-gray-200 transition-all -translate-y-1/2 rounded-full shadow-lg right-2 sm:right-4 top-1/2 bg-white/90 dark:bg-neutral-800/90 hover:bg-white dark:hover:bg-neutral-700 hover:scale-110 active:scale-95 cursor-pointer"
      >
        ❯
      </button>

      {/* Bottom Indicator Dots */}
      <div className="absolute z-20 flex items-center gap-1.5 px-3 py-1.5 -translate-x-1/2 bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-full shadow-sm bottom-2.5 left-1/2 max-w-[85%] overflow-x-auto">
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(idx);
            }}
            aria-label={`Go to slide ${idx + 1}`}
            className={`transition-all duration-300 rounded-full flex-shrink-0 cursor-pointer ${
              currentIndex === idx
                ? "w-6 h-2 bg-emerald-500"
                : "w-2 h-2 bg-gray-300 dark:bg-neutral-600 hover:bg-gray-500"
            }`}
          />
        ))}
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress {
          animation-name: progress;
        }
        @keyframes fadeIn {
          from { opacity: 0.2; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.35s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Hero;
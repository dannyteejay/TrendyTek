import React, { useState, useMemo } from "react";
import Title from "../components/Title";
import NewsletterBox from "../components/Newsletter";
import { Link } from "react-router-dom";

const FAQ_DATA = [
  {
    category: "Payments & Gateways",
    icon: "💳",
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We support a wide variety of secure payment methods to make checkout seamless: \n• Credit & Debit Cards (via Stripe and Paystack)\n• Direct Bank Transfer (Guaranty Trust Bank)\n• Cryptocurrency (via NOWPayments: BTC, ETH, USDT, and more)\n• Cash on Delivery (COD) for eligible locations.",
      },
      {
        q: "How does the Direct Bank Transfer option work?",
        a: "When you select 'Bank Transfer' at checkout, you will receive our verified bank account details (Guaranty Trust Bank). Transfer the exact order total using your Full Name or Phone Number as the payment narration/reference. Our team verifies the transaction and confirms your order shortly.",
      },
      {
        q: "Can I pay using Cryptocurrency?",
        a: "Yes! TrendyTek integrates with NOWPayments, allowing you to pay using popular crypto assets like Bitcoin (BTC), Ethereum (ETH), USDT, and others. The payment will automatically calculate the current exchange rate at checkout.",
      },
      {
        q: "Is my payment information secure?",
        a: "Absolutely. All online transactions are processed through 256-bit encrypted SSL connections and handled by PCI-DSS compliant payment gateways (Stripe & Paystack). We never store your card numbers or CVV on our servers.",
      },
      {
        q: "Will I receive an invoice/receipt after payment?",
        a: "Yes. Once your order and payment are confirmed, a receipt with your itemized breakdown and order ID will be generated and can be viewed anytime in your 'Orders' page.",
      },
    ],
  },
  {
    category: "Orders & Shipping",
    icon: "📦",
    questions: [
      {
        q: "How do I track the status of my order?",
        a: "You can track your order at any time by logging into your account, clicking on your profile icon in the navigation bar, and selecting 'Orders'. You will see real-time status updates such as 'Order Placed', 'Packing', 'Shipped', 'Out for delivery', and 'Delivered'.",
      },
      {
        q: "How long does delivery take?",
        a: "Standard doorstep delivery typically takes 2 to 5 business days depending on your location. You will receive real-time notifications as your parcel progresses through dispatch and delivery.",
      },
      {
        q: "How much is the delivery fee?",
        a: "Delivery fees are calculated and clearly shown in your Cart and Checkout summary before you confirm your order. We also occasionally run free shipping promotions!",
      },
      {
        q: "Can I cancel or modify my order after placing it?",
        a: "If your order has not been dispatched yet, you can contact our customer support team immediately through the Contact page or by email with your Order ID, and we will do our best to update or cancel it for you.",
      },
    ],
  },
  {
    category: "Returns & Refunds",
    icon: "🔄",
    questions: [
      {
        q: "What is your return policy?",
        a: "We offer a 10-day hassle-free return and exchange policy. If you receive an item that is damaged, defective, or incorrect in size, you can request a replacement or return within 10 days of delivery.",
      },
      {
        q: "How do I initiate a return or exchange?",
        a: "Simply head over to our 'Contact Us' page or email contact@trendytek.com with your Order ID, product photos (if damaged/incorrect), and reason for return. Our support team will guide you through the return pickup.",
      },
      {
        q: "How long does it take to get a refund?",
        a: "Once we inspect and approve the returned product, your refund will be processed within 3 to 5 business days back to your original payment method or bank account.",
      },
    ],
  },
  {
    category: "Account & Security",
    icon: "👤",
    questions: [
      {
        q: "How do I reset my password if I forget it?",
        a: "On the Login page, click 'Forgot your password?'. Enter your registered email address and we will immediately send a secure 6-digit OTP code to your Gmail/inbox. Enter the OTP along with your new password to restore access in seconds.",
      },
      {
        q: "Can I customize my profile and avatar?",
        a: "Yes! Navigate to your 'Profile' page from the top navigation dropdown. You can upload a personalized profile photo, update your full name, and manage your account credentials.",
      },
      {
        q: "How do I switch between Light and Dark mode?",
        a: "You can toggle between sleek Dark Mode and clean Light Mode anytime by clicking the Sun/Moon icon located in the top navigation bar.",
      },
    ],
  },
  {
    category: "Products & Quality",
    icon: "🛍️",
    questions: [
      {
        q: "Are all products on TrendyTek 100% authentic?",
        a: "Yes, every single product sold on TrendyTek is 100% authentic, sourced directly from verified manufacturers and trusted distributors. We back this up with our Quality Guarantee.",
      },
      {
        q: "How do I choose the correct size for apparel and shoes?",
        a: "On the product details page, click on your desired size (e.g. S, M, L, XL, XXL) before clicking 'ADD TO CART'. If you have specific sizing inquiries, our support team is happy to assist you.",
      },
      {
        q: "What if an item I want is out of stock?",
        a: "We frequently restock popular items. Subscribe to our newsletter at the bottom of the page or check back regularly to get notified when items are back in stock.",
      },
    ],
  },
];

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openItems, setOpenItems] = useState({});

  // Categories list
  const categories = useMemo(() => {
    return ["All", ...FAQ_DATA.map((item) => item.category)];
  }, []);

  // Filtered FAQs based on category tab & search query
  const filteredData = useMemo(() => {
    return FAQ_DATA.map((cat) => {
      // If a specific category tab is selected and doesn't match, skip questions
      if (selectedCategory !== "All" && cat.category !== selectedCategory) {
        return { ...cat, questions: [] };
      }

      // Filter by search query
      const matchingQuestions = cat.questions.filter((item) => {
        const qMatch = item.q.toLowerCase().includes(searchQuery.toLowerCase());
        const aMatch = item.a.toLowerCase().includes(searchQuery.toLowerCase());
        return qMatch || aMatch;
      });

      return {
        ...cat,
        questions: matchingQuestions,
      };
    }).filter((cat) => cat.questions.length > 0);
  }, [searchQuery, selectedCategory]);

  // Toggle accordion item
  const toggleItem = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Expand all / Collapse all helper
  const toggleAll = (expand) => {
    const nextState = {};
    if (expand) {
      filteredData.forEach((cat, catIdx) => {
        cat.questions.forEach((_, qIdx) => {
          nextState[`${catIdx}-${qIdx}`] = true;
        });
      });
    }
    setOpenItems(nextState);
  };

  const totalQuestionsCount = filteredData.reduce(
    (acc, curr) => acc + curr.questions.length,
    0
  );

  return (
    <div className="pt-8 pb-16 transition-colors duration-300 text-gray-800 dark:text-gray-100">
      {/* 1. Header Section */}
      <div className="pt-8 text-2xl text-center border-t border-gray-200 dark:border-slate-800">
        <Title text1={"FREQUENTLY ASKED"} text2={"QUESTIONS"} />
        <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Need answers? Find fast solutions to common questions about payments,
          order shipping, returns, and your TrendyTek account.
        </p>
      </div>

      {/* 2. Interactive Search Bar */}
      <div className="max-w-2xl mx-auto mt-8">
        <div className="relative flex items-center shadow-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions (e.g., bank transfer, returns, tracking, crypto)..."
            className="w-full px-5 py-3.5 pl-12 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-gray-900 dark:text-gray-100"
          />
          <svg
            className="absolute left-4 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 text-xs font-semibold px-2 py-1 bg-gray-200 dark:bg-slate-700 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 3. Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-6 max-w-3xl mx-auto">
        {categories.map((cat, idx) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={idx}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-all cursor-pointer border ${
                isActive
                  ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm"
                  : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-gray-400"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 4. Controls: Questions count + Expand/Collapse All */}
      <div className="flex items-center justify-between max-w-4xl mx-auto mt-8 px-2 text-xs text-gray-500 dark:text-gray-400">
        <span>
          Showing <b className="text-gray-900 dark:text-white">{totalQuestionsCount}</b> {totalQuestionsCount === 1 ? "question" : "questions"}
        </span>
        <div className="flex gap-3">
          <button
            onClick={() => toggleAll(true)}
            className="hover:text-black dark:hover:text-white underline cursor-pointer"
          >
            Expand all
          </button>
          <span>•</span>
          <button
            onClick={() => toggleAll(false)}
            className="hover:text-black dark:hover:text-white underline cursor-pointer"
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* 5. FAQs Accordion List */}
      <div className="max-w-4xl mx-auto mt-4 flex flex-col gap-8">
        {filteredData.length === 0 ? (
          <div className="py-16 text-center bg-gray-50 dark:bg-slate-900 border border-dashed border-gray-300 dark:border-slate-800 rounded-2xl">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
              No matching questions found
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Try searching with a different keyword or browse other categories.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition-opacity"
            >
              Reset Search Filters
            </button>
          </div>
        ) : (
          filteredData.map((categorySection, catIdx) => (
            <div
              key={catIdx}
              className="bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xs"
            >
              {/* Category Heading */}
              <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 dark:border-slate-800 mb-4">
                <span className="text-xl">{categorySection.icon}</span>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  {categorySection.category}
                </h2>
              </div>

              {/* Questions Accordion in this category */}
              <div className="flex flex-col gap-3">
                {categorySection.questions.map((item, qIdx) => {
                  const key = `${catIdx}-${qIdx}`;
                  const isOpen = !!openItems[key];

                  return (
                    <div
                      key={qIdx}
                      className={`border rounded-xl transition-all ${
                        isOpen
                          ? "border-gray-300 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/40"
                          : "border-gray-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-gray-300"
                      }`}
                    >
                      <button
                        onClick={() => toggleItem(catIdx, qIdx)}
                        className="w-full flex items-center justify-between gap-4 p-4 text-left cursor-pointer transition-colors"
                        aria-expanded={isOpen}
                      >
                        <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                          {item.q}
                        </span>
                        <div
                          className={`w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 transition-transform duration-300 shrink-0 ${
                            isOpen ? "rotate-180 bg-black text-white dark:bg-white dark:text-black" : ""
                          }`}
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line border-t border-gray-100 dark:border-slate-800 mt-1">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 6. "Still Have Questions?" Support Box */}
      <div className="max-w-4xl mx-auto mt-14 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-slate-900 dark:to-slate-800 text-white rounded-2xl p-6 sm:p-10 shadow-lg text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl">
          💬
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-bold">Still have questions?</h3>
          <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto mt-1">
            Can’t find the answer you’re looking for? Our dedicated TrendyTek support team is here to assist you 24/7.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          <Link
            to="/contact"
            className="px-6 py-2.5 text-xs sm:text-sm font-semibold bg-white text-gray-900 rounded-lg hover:bg-gray-100 active:scale-95 transition-all shadow-md"
          >
            Contact Customer Support
          </Link>
          <a
            href="mailto:contact@trendytek.com"
            className="px-6 py-2.5 text-xs sm:text-sm font-semibold bg-white/15 border border-white/20 text-white rounded-lg hover:bg-white/25 active:scale-95 transition-all"
          >
            Email Us Directly
          </a>
        </div>
      </div>

      {/* 7. Newsletter Box */}
      <div className="mt-16">
        <NewsletterBox />
      </div>
    </div>
  );
};

export default FAQ;
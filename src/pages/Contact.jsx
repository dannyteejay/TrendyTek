import React, { useContext, useEffect, useState } from "react";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import NewsletterBox from "../components/NewsletterBox";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";

const Contact = () => {
  const { backendUrl } = useContext(ShopContext);
  const [contactData, setContactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Message Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchContact = async () => {
      try {
        const response = await axios.get(backendUrl + "/api/contact/get");
        if (isMounted && response.data.success && response.data.contact) {
          setContactData(response.data.contact);
        }
      } catch (error) {
        console.error("Failed to load contact data:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchContact();

    return () => {
      isMounted = false;
    };
  }, [backendUrl]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in your name, email, and message");
      return;
    }

    setSending(true);
    try {
      const response = await axios.post(
        backendUrl + "/api/contact/send-message",
        {
          name,
          email,
          phone,
          subject,
          message,
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Message sent successfully!");
        setName("");
        setEmail("");
        setPhone("");
        setSubject("");
        setMessage("");
      } else {
        toast.error(response.data.message || "Failed to send message");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setSending(false);
    }
  };

  const subtitle = contactData?.subtitle || "Get in Touch with Our Team";
  const storeAddress =
    contactData?.storeAddress ||
    "54709 Willms Station, Suite 350, Washington, USA";
  const phoneVal = contactData?.phone || "+1 (415) 555-0132";
  const emailVal = contactData?.email || "support@trendify.com";
  const whatsappVal = contactData?.whatsapp || "";
  const hoursVal = contactData?.hours || "Mon - Sat: 9:00 AM - 7:00 PM (EST)";
  const careersTitle = contactData?.careersTitle || "Careers at Trendify";
  const careersText =
    contactData?.careersText ||
    "Learn more about our dynamic teams, company culture, and open job opportunities.";
  const careersButtonText = contactData?.careersButtonText || "Explore Openings";
  const careersLink = contactData?.careersLink || "mailto:careers@trendify.com";
  const branches = contactData?.branches || [];

  const bannerImage = !loading
    ? contactData?.image && contactData.image.trim() !== ""
      ? contactData.image
      : assets.contact_img
    : null;

  return (
    <div className="pt-8 pb-16 transition-colors duration-300 text-gray-800 dark:text-gray-100">
      {/* 1. Header */}
      <div className="pt-8 text-2xl text-center border-t border-gray-200 dark:border-slate-800">
        <Title text1={"CONTACT"} text2={"US"} />
        {subtitle && (
          <p className="mt-1 text-xs font-semibold tracking-widest text-gray-500 dark:text-gray-300 uppercase">
            {subtitle}
          </p>
        )}
      </div>

      {/* 2. Main Grid */}
      <div className="grid items-start grid-cols-1 gap-10 my-10 lg:grid-cols-12">
        {/* Left Column: Image & Direct Message Form */}
        <div className="flex flex-col gap-8 lg:col-span-6">
          {/* Banner Photo Container */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl rounded-2xl min-h-[260px] sm:min-h-[340px] flex items-center justify-center p-6">
            {(loading || !imageLoaded) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-900 animate-pulse">
                <div className="w-8 h-8 border-black dark:border-white rounded-full border-3 border-t-transparent animate-spin"></div>
                <span className="mt-2 text-[11px] font-semibold text-gray-400 dark:text-gray-300 uppercase tracking-wider">
                  Loading banner...
                </span>
              </div>
            )}

            {bannerImage && (
              <img
                key={bannerImage}
                onLoad={() => setImageLoaded(true)}
                className={`object-contain w-full h-auto max-h-[320px] transition-all duration-500 ease-in-out ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                } dark:brightness-125 dark:contrast-125`}
                src={bannerImage}
                alt="Contact Our Team"
              />
            )}
          </div>

          {/* Contact Us Form */}
          <div className="p-6 border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 sm:p-8 rounded-2xl shadow-sm">
            <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>✉️</span> Send Us a Direct Message
            </h3>
            <p className="mb-4 text-xs text-gray-600 dark:text-gray-300">
              Have a question, feedback, or custom inquiry? We usually respond within a few hours.
            </p>

            <form onSubmit={handleSendMessage} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name *"
                  required
                  className="px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg outline-none focus:border-black dark:focus:border-white"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your Email *"
                  required
                  className="px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg outline-none focus:border-black dark:focus:border-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number (optional)"
                  className="px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg outline-none focus:border-black dark:focus:border-white"
                />
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject / Topic"
                  className="px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg outline-none focus:border-black dark:focus:border-white"
                />
              </div>

              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help you today? *"
                required
                className="px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg outline-none focus:border-black dark:focus:border-white"
              />

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 text-xs font-bold tracking-wider text-white uppercase transition-all bg-black dark:bg-white dark:text-black rounded-lg shadow-md sm:text-sm hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-95"
              >
                {sending ? "Sending Message..." : "Send Message &rarr;"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Store Details & Branches & Careers */}
        <div className="flex flex-col gap-6 lg:col-span-6">
          {/* Main Store Location */}
          <div className="flex flex-col gap-4 p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 sm:p-8 rounded-2xl shadow-sm">
            <h3 className="flex items-center gap-2 pb-3 text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-800 sm:text-lg">
              <span>🏢</span> Our Headquarters / Store
            </h3>

            <div className="flex flex-col gap-4 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <span className="text-base">📍</span>
                <div>
                  <b className="block text-xs font-bold text-gray-900 dark:text-white mb-0.5">
                    Address:
                  </b>
                  <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                    {storeAddress}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-base">📞</span>
                <div>
                  <b className="block text-xs font-bold text-gray-900 dark:text-white mb-0.5">
                    Telephone:
                  </b>
                  <a
                    href={`tel:${phoneVal}`}
                    className="font-semibold text-gray-900 dark:text-blue-400 hover:underline"
                  >
                    {phoneVal}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-base">✉️</span>
                <div>
                  <b className="block text-xs font-bold text-gray-900 dark:text-white mb-0.5">
                    Email Support:
                  </b>
                  <a
                    href={`mailto:${emailVal}`}
                    className="font-semibold text-gray-900 dark:text-blue-400 hover:underline"
                  >
                    {emailVal}
                  </a>
                </div>
              </div>

              {whatsappVal && (
                <div className="flex items-start gap-3">
                  <span className="text-base">💬</span>
                  <div>
                    <b className="block text-xs font-bold text-gray-900 dark:text-white mb-0.5">
                      WhatsApp:
                    </b>
                    <a
                      href={`https://wa.me/${whatsappVal.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-green-600 dark:text-green-400 hover:underline"
                    >
                      {whatsappVal}
                    </a>
                  </div>
                </div>
              )}

              {hoursVal && (
                <div className="flex items-start gap-3">
                  <span className="text-base">🕒</span>
                  <div>
                    <b className="block text-xs font-bold text-gray-900 dark:text-white mb-0.5">
                      Opening Hours:
                    </b>
                    <p className="text-gray-700 dark:text-gray-200">
                      {hoursVal}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Branches */}
          {branches.length > 0 && (
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-bold tracking-wider text-gray-900 dark:text-white uppercase flex items-center gap-1.5">
                <span>📍</span> Other Locations & Departments
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {branches.map((b, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-1.5 p-4 text-xs border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 rounded-xl"
                  >
                    <b className="text-sm font-bold text-gray-900 dark:text-white">
                      {b.name}
                    </b>
                    <p className="text-gray-700 dark:text-gray-300">{b.address}</p>
                    {b.phone && (
                      <p className="text-gray-900 dark:text-gray-200">
                        📞 <a href={`tel:${b.phone}`} className="font-semibold dark:text-blue-400">{b.phone}</a>
                      </p>
                    )}
                    {b.email && (
                      <p className="text-gray-900 dark:text-gray-200">
                        ✉️ <a href={`mailto:${b.email}`} className="font-semibold dark:text-blue-400">{b.email}</a>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Careers Section - Solid High Contrast Button */}
          <div className="flex flex-col gap-3 p-6 sm:p-8 bg-black dark:bg-slate-900 border border-gray-900 dark:border-slate-700 rounded-2xl shadow-lg">
            <h3 className="text-base font-bold text-white sm:text-lg">
              {careersTitle}
            </h3>
            <p className="text-xs leading-relaxed text-gray-300 sm:text-sm">
              {careersText}
            </p>
            <div className="pt-2">
              <a
                href={careersLink}
                target={careersLink?.startsWith("http") ? "_blank" : "_self"}
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs sm:text-sm font-bold tracking-wider rounded-lg hover:bg-gray-200 active:scale-95 transition-all shadow-md"
                style={{ backgroundColor: "#ffffff", color: "#000000" }}
              >
                <span>{careersButtonText}</span> &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <NewsletterBox />
    </div>
  );
};

export default Contact;
import React, { useContext } from "react";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";

const Footer = () => {
  const { logo, storeName, footerData } = useContext(ShopContext);

  const description =
    footerData?.footerDescription ||
    "Discover the best trends and everyday essentials. Premium quality, fast delivery, and dedicated customer care tailored for your lifestyle.";

  const companyTitle = footerData?.companyTitle || "COMPANY";

  const companyLinks =
    footerData?.companyLinks && footerData.companyLinks.length > 0
      ? footerData.companyLinks
      : [
          { title: "Home", url: "/" },
          { title: "About us", url: "/about" },
          { title: "Contact", url: "/contact" },
          { title: "Collection", url: "/collection" },
          { title: "Blog", url: "/blog" }, // 👈 Links to Blog
          { title: "FAQ", url: "/faq" },
        ];

  const contactTitle = footerData?.contactTitle || "GET IN TOUCH";
  const contactPhone = footerData?.contactPhone || "+1-212-456-7890";
  const contactEmail = footerData?.contactEmail || "contact@trendify.com";
  const contactAddress = footerData?.contactAddress || "";
  const customCopyright = footerData?.copyrightText;

  return (
    <div className="transition-colors duration-300">
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">
        {/* Left Column: Dynamic Store Logo & Description */}
<div>
  <Link to="/" className="inline-block">
    {logo ? (
      <img
        src={logo}
        className="object-contain h-10 sm:h-12 md:h-14 w-auto max-w-[220px] sm:max-w-[280px] md:max-w-[340px] mb-5 dark:brightness-0 dark:invert transition-all"
        alt={storeName || "TrendyTek"}
      />
    ) : (
      <div className="flex items-center gap-1 select-none mb-5">
        <span className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white uppercase font-sans">
          TRENDY<span className="text-blue-600 dark:text-blue-400">TEK</span>
        </span>
      </div>
    )}
  </Link>
  <p className="w-full md:w-2/3 leading-relaxed text-gray-500 dark:text-gray-400">
    {footerData?.footerDescription || defaultDescription}
  </p>
</div>

        {/* Middle Column: Dynamic Company Links */}
        <div>
          <p className="mb-5 text-xl font-bold text-gray-900 dark:text-white">
            {companyTitle}
          </p>
          <ul className="flex flex-col gap-2 text-gray-600 dark:text-gray-300">
            {companyLinks.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.url || "/"}
                  className="hover:text-black dark:hover:text-white transition-colors"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column: Dynamic Get In Touch Details */}
        <div>
          <p className="mb-5 text-xl font-bold text-gray-900 dark:text-white">
            {contactTitle}
          </p>
          <ul className="flex flex-col gap-2 text-gray-600 dark:text-gray-300">
            {contactPhone && (
              <li className="flex items-center gap-2">
                <a
                  href={`tel:${contactPhone}`}
                  className="hover:text-black dark:hover:text-white transition-colors"
                >
                  {contactPhone}
                </a>
              </li>
            )}
            {contactEmail && (
              <li className="flex items-center gap-2">
                <a
                  href={`mailto:${contactEmail}`}
                  className="hover:text-black dark:hover:text-white transition-colors"
                >
                  {contactEmail}
                </a>
              </li>
            )}
            {contactAddress && (
              <li className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                {contactAddress}
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div>
        <hr className="border-gray-200 dark:border-slate-800" />
        <p className="py-5 text-xs text-center text-gray-500 dark:text-gray-400 sm:text-sm">
          {customCopyright ||
            `Copyright ${new Date().getFullYear()} @ ${storeName || "trendify.com"} - All Rights Reserved.`}
        </p>
      </div>
    </div>
  );
};

export default Footer;
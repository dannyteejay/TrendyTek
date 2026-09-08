import React, { useContext, useEffect, useState } from "react";
import Title from "../components/Title";
import NewsletterBox from "../components/NewsletterBox";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";

const DEFAULT_FEATURES = [
  {
    title: "Quality Assurance",
    description:
      "We meticulously select and vet each product to ensure it meets our stringent quality standards.",
  },
  {
    title: "Convenience",
    description:
      "With our user-friendly interface and hassle-free ordering process, shopping has never been easier.",
  },
  {
    title: "Exceptional Customer Service",
    description:
      "Our team of dedicated professionals is here to assist you every step of the way, ensuring your satisfaction is our top priority.",
  },
];

const About = () => {
  const { backendUrl } = useContext(ShopContext);

  // 🚀 Instant Caching: Load image directly from localStorage on first render with ZERO flashing
  const [cachedImage, setCachedImage] = useState(() => {
    return localStorage.getItem("aboutImage") || "";
  });
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(!cachedImage);
  const [imageLoaded, setImageLoaded] = useState(Boolean(cachedImage));

  useEffect(() => {
    let isMounted = true;

    const fetchAbout = async () => {
      try {
        const response = await axios.get(backendUrl + "/api/about/get");
        if (isMounted && response.data?.success && response.data?.about) {
          setAboutData(response.data.about);
          if (response.data.about.image) {
            setCachedImage(response.data.about.image);
            localStorage.setItem("aboutImage", response.data.about.image);
            setImageLoaded(true);
          }
        }
      } catch (error) {
        console.error("Failed to load about data:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAbout();

    return () => {
      isMounted = false;
    };
  }, [backendUrl]);

  const subtitle = aboutData?.subtitle || "Find What Moves You";
  const story1 =
    aboutData?.storyParagraph1 ||
    "TrendyTek was born out of a passion for innovation and a desire to revolutionize the way people shop online. Our journey began with a simple idea: to provide a platform where customers can easily discover, explore, and purchase a wide range of premium products from the comfort of their homes.";
  const story2 =
    aboutData?.storyParagraph2 ||
    "Since our inception, we've worked tirelessly to curate a diverse selection of high-quality products that cater to every taste and lifestyle. From fashion and tech essentials to everyday gadgets, we offer an extensive collection sourced from trusted brands and manufacturers.";
  const mission =
    aboutData?.mission ||
    "Our mission at TrendyTek is to empower customers with choice, convenience, and confidence. We're dedicated to providing a seamless shopping experience that exceeds expectations, from browsing and ordering to fast delivery and beyond.";
  const featureList =
    aboutData?.features && aboutData.features.length > 0
      ? aboutData.features
      : DEFAULT_FEATURES;

  // Banner image: Uses live image or instant cached image with zero template asset fallback
  const bannerImage = aboutData?.image || cachedImage || "";

  return (
    <div className="pt-8 pb-16 transition-colors duration-300 text-gray-800 dark:text-gray-100">
      {/* 1. Header Title */}
      <div className="pt-8 text-2xl text-center border-t border-gray-200 dark:border-slate-800">
        <Title text1={"ABOUT"} text2={"US"} />
        {subtitle && (
          <p className="mt-1 text-xs font-semibold tracking-widest text-gray-500 dark:text-gray-300 uppercase">
            {subtitle}
          </p>
        )}
      </div>

      {/* 2. Main Story & Mission Section */}
      <div className="flex flex-col gap-12 my-10 md:flex-row md:items-center">
        {/* Banner Image Container */}
        <div className="flex justify-center w-full md:w-1/2">
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl rounded-2xl w-full max-w-[480px] min-h-[300px] flex items-center justify-center p-3">
            {/* Show loader only if we have NO cached image yet */}
            {!bannerImage && loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-900 animate-pulse">
                <div className="w-8 h-8 border-black dark:border-white rounded-full border-3 border-t-transparent animate-spin"></div>
                <span className="mt-2 text-[11px] font-semibold text-gray-400 dark:text-gray-300 uppercase tracking-wider">
                  Loading banner...
                </span>
              </div>
            )}

            {/* Custom Uploaded Banner Image */}
            {bannerImage && (
              <img
                key={bannerImage}
                onLoad={() => setImageLoaded(true)}
                className={`object-contain w-full h-auto max-h-[460px] rounded-xl hover:scale-102 transition-all duration-300 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                src={bannerImage}
                alt="About Us Banner"
              />
            )}

            {/* Placeholder if no image has been uploaded yet */}
            {!bannerImage && !loading && (
              <div className="flex flex-col items-center justify-center text-center p-6 text-gray-400">
                <span className="text-4xl mb-2">🏢</span>
                <p className="text-xs font-semibold">About Us Banner</p>
                <p className="text-[10px] text-gray-400">Upload in Admin &rarr; Manage About</p>
              </div>
            )}
          </div>
        </div>

        {/* Story Text */}
        <div className="flex flex-col justify-center gap-5 text-sm leading-relaxed text-gray-700 dark:text-gray-200 md:w-1/2 sm:text-base">
          <p>{story1}</p>
          <p>{story2}</p>

          <div className="p-5 mt-2 border-l-4 border-blue-600 dark:border-blue-400 bg-gray-50 dark:bg-slate-900 rounded-r-xl shadow-xs border border-gray-200 dark:border-slate-800">
            <b className="block mb-1 text-xs font-bold tracking-wider text-gray-900 dark:text-white uppercase sm:text-sm">
              🎯 Our Mission
            </b>
            <p className="text-xs text-gray-700 dark:text-gray-200 sm:text-sm leading-relaxed">
              {mission}
            </p>
          </div>
        </div>
      </div>

      {/* 3. "Why Choose Us" Benefits Section */}
      <div className="py-8 mt-12 text-xl text-center sm:text-2xl">
        <Title text1={"WHY"} text2={"CHOOSE US"} />
      </div>

      <div className="grid grid-cols-1 gap-6 mb-20 md:grid-cols-3">
        {featureList.map((feature, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 p-8 transition-all duration-300 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs rounded-2xl hover:shadow-lg hover:-translate-y-1"
          >
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 text-xs font-bold text-white dark:text-black bg-black dark:bg-white rounded-full">
                {index + 1}
              </span>
              <b className="text-base font-bold text-gray-900 dark:text-white">
                {feature.title}
              </b>
            </div>
            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300 sm:text-sm">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* 4. Newsletter Box */}
      <NewsletterBox />
    </div>
  );
};

export default About;
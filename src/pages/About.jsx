import React, { useContext, useEffect, useState } from "react";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import Newsletter from "../components/Newsletter";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";

const DEFAULT_ABOUT = {
  title: "ABOUT US",
  subtitle: "Find What Moves You",
  image: "",
  storyParagraph1:
    "Trendify was born out of a passion for innovation and a desire to revolutionize the way people shop online. Our journey began with a simple idea: to provide a platform where customers can easily discover, explore, and purchase a wide range of products from the comfort of their homes.",
  storyParagraph2:
    "Since our inception, we've worked tirelessly to curate a diverse selection of high-quality products that cater to every taste and preference. From fashion and beauty to electronics, gadgets, and software essentials, we offer an extensive collection sourced from trusted brands and suppliers.",
  mission:
    "Our mission at Trendify is to empower customers with choice, convenience, and confidence. We're dedicated to providing a seamless shopping experience that exceeds expectations, from browsing and ordering to delivery and beyond.",
  features: [
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
  ],
};

const About = () => {
  const { backendUrl } = useContext(ShopContext);
  const [aboutData, setAboutData] = useState(DEFAULT_ABOUT);
  const [loading, setLoading] = useState(true);

  // Fetch live About Us content from backend
  const fetchAbout = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/about/get");
      if (response.data.success && response.data.about) {
        setAboutData(response.data.about);
      }
    } catch (error) {
      console.error("Failed to load about data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbout();
  }, []);

  const bannerImage = aboutData.image || assets.about_img;
  const featureList =
    aboutData.features && aboutData.features.length > 0
      ? aboutData.features
      : DEFAULT_ABOUT.features;

  return (
    <div className="pt-8 pb-16">
      {/* 1. Header Title */}
      <div className="pt-8 text-2xl text-center border-t">
        <Title text1={"ABOUT"} text2={"US"} />
        {aboutData.subtitle && (
          <p className="mt-1 text-xs font-semibold tracking-widest text-gray-400 uppercase">
            {aboutData.subtitle}
          </p>
        )}
      </div>

      {/* 2. Main Story & Mission Section */}
      <div className="flex flex-col gap-12 my-10 md:flex-row md:items-center">
        {/* Banner Image */}
        <div className="flex justify-center w-full md:w-1/2">
          <div className="overflow-hidden bg-white border border-gray-100 shadow-xl rounded-2xl max-w-[480px]">
            <img
              className="object-cover w-full h-auto max-h-[460px] hover:scale-103 transition-transform duration-500"
              src={bannerImage}
              alt="About Trendytek"
            />
          </div>
        </div>

        {/* Story Text */}
        <div className="flex flex-col justify-center gap-5 text-sm leading-relaxed text-gray-600 md:w-1/2 sm:text-base">
          <p>{aboutData.storyParagraph1}</p>
          <p>{aboutData.storyParagraph2}</p>

          <div className="p-5 mt-2 border-l-4 border-black bg-gray-50 rounded-r-xl shadow-2xs">
            <b className="block mb-1 text-xs font-bold tracking-wider text-gray-900 uppercase sm:text-sm">
              🎯 Our Mission
            </b>
            <p className="text-xs text-gray-700 sm:text-sm">{aboutData.mission}</p>
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
            className="flex flex-col gap-3 p-8 transition-all duration-300 bg-white border border-gray-200 shadow-xs rounded-2xl hover:shadow-lg hover:-translate-y-1"
          >
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 text-xs font-bold text-white bg-black rounded-full">
                {index + 1}
              </span>
              <b className="text-base font-bold text-gray-900">{feature.title}</b>
            </div>
            <p className="text-xs leading-relaxed text-gray-500 sm:text-sm">
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
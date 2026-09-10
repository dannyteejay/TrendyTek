/**
 * Cloudinary Dynamic URL Transformation Builder
 */
export const getOptimizedImageUrl = (url, options = {}) => {
  if (!url || typeof url !== "string") return "/placeholder.png";

  // If not hosted on Cloudinary, return the original URL
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  const {
    width,
    height,
    crop = "fill",
    quality = "auto",
    format = "auto",
  } = options;

  const transformations = [];

  // 1. Auto-format (delivers AVIF/WebP automatically)
  transformations.push(`f_${format}`);

  // 2. Intelligent Auto-Compression
  transformations.push(`q_${quality}`);

  // 3. Responsive Resize & Cropping
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (width || height) transformations.push(`c_${crop}`);

  const transformString = transformations.join(",");

  // Insert transformations after "/upload/"
  return url.replace("/upload/", `/upload/${transformString}/`);
};

export const IMAGE_PRESETS = {
  THUMBNAIL: { width: 120, height: 120, crop: "fill", quality: "auto" },
  PRODUCT_CARD: { width: 450, height: 550, crop: "fill", quality: "auto" },
  PRODUCT_HERO: { width: 1000, height: 1200, crop: "fill", quality: "auto:good" },
  HERO_BANNER: { width: 1600, height: 700, crop: "fill", quality: "auto" },
  AVATAR: { width: 160, height: 160, crop: "thumb", quality: "auto" },
};
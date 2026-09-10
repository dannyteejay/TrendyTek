import apiClient from "./client";

export const contentApi = {
  // Store branding & payment gateway configuration
  getSettings: () => apiClient.get("/api/setting/get"),

  // Dynamic blog articles
  getBlogs: () => apiClient.get("/api/blog/list"),

  // FAQ accordion items
  getFaqs: () => apiClient.get("/api/faq/list"),

  // Banner carousel slides
  getSlides: () => apiClient.get("/api/slide/list"),

  // About story and team content
  getAbout: () => apiClient.get("/api/about/get"),

  // Newsletter subscription
  subscribeNewsletter: (email) => apiClient.post("/api/subscriber/add", { email }),

  // Contact inbox message submission
  submitContact: (data) => apiClient.post("/api/contact/add", data),
};
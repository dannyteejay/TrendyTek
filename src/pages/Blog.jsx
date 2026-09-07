import React, { useState, useMemo, useEffect, useContext } from "react";
import Title from "../components/Title";
import NewsletterBox from "../components/Newsletter";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

const Blog = () => {
  const { backendUrl } = useContext(ShopContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPost, setSelectedPost] = useState(null);
  const [likedPosts, setLikedPosts] = useState({});
  const [blogList, setBlogList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(backendUrl + "/api/blog/list");
      if (response.data.success && response.data.blogs) {
        setBlogList(response.data.blogs);
      }
    } catch (error) {
      console.error("Failed to load blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [backendUrl]);

  useEffect(() => {
    const postId = searchParams.get("post");
    if (postId && blogList.length > 0) {
      const match = blogList.find((p) => p._id === postId || p.id === postId);
      if (match) {
        setSelectedPost(match);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (!postId) {
      setSelectedPost(null);
    }
  }, [searchParams, blogList]);

  const categories = useMemo(() => {
    const cats = new Set(blogList.map((item) => item.category).filter(Boolean));
    return ["All", ...Array.from(cats)];
  }, [blogList]);

  const filteredPosts = useMemo(() => {
    return blogList.filter((post) => {
      const matchesCategory =
        selectedCategory === "All" || post.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        post.title?.toLowerCase().includes(q) ||
        post.summary?.toLowerCase().includes(q) ||
        post.author?.toLowerCase().includes(q) ||
        post.category?.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [blogList, searchQuery, selectedCategory]);

  const featuredPost = useMemo(() => {
    return blogList.find((p) => p.featured) || blogList[0];
  }, [blogList]);

  const handleLike = async (postId, e) => {
    if (e) e.stopPropagation();
    if (likedPosts[postId]) return;

    setLikedPosts((prev) => ({ ...prev, [postId]: true }));
    setBlogList((prev) =>
      prev.map((p) =>
        p._id === postId || p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p
      )
    );

    if (selectedPost && (selectedPost._id === postId || selectedPost.id === postId)) {
      setSelectedPost((prev) => ({ ...prev, likes: (prev.likes || 0) + 1 }));
    }

    toast.success("❤️ Liked article!");

    try {
      await axios.post(`${backendUrl}/api/blog/like/${postId}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPost = (post) => {
    setSelectedPost(post);
    setSearchParams({ post: post._id || post.id });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClosePost = () => {
    setSelectedPost(null);
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("🔗 Article link copied to clipboard!");
  };

  const renderFormattedContent = (contentStr) => {
    if (!contentStr) return null;
    const lines = contentStr.split("\n");
    const blocks = [];
    let currentParagraph = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("### ")) {
        if (currentParagraph.length > 0) {
          blocks.push({ type: "p", text: currentParagraph.join("\n") });
          currentParagraph = [];
        }
        blocks.push({ type: "h3", text: trimmed.replace("### ", "") });
      } else if (trimmed.startsWith("## ")) {
        if (currentParagraph.length > 0) {
          blocks.push({ type: "p", text: currentParagraph.join("\n") });
          currentParagraph = [];
        }
        blocks.push({ type: "h2", text: trimmed.replace("## ", "") });
      } else if (trimmed.startsWith("> ")) {
        if (currentParagraph.length > 0) {
          blocks.push({ type: "p", text: currentParagraph.join("\n") });
          currentParagraph = [];
        }
        blocks.push({ type: "quote", text: trimmed.replace("> ", "") });
      } else if (trimmed === "") {
        if (currentParagraph.length > 0) {
          blocks.push({ type: "p", text: currentParagraph.join("\n") });
          currentParagraph = [];
        }
      } else {
        currentParagraph.push(line);
      }
    });

    if (currentParagraph.length > 0) {
      blocks.push({ type: "p", text: currentParagraph.join("\n") });
    }

    return blocks.map((block, idx) => {
      if (block.type === "h2" || block.type === "h3") {
        return (
          <h3
            key={idx}
            className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-6 pt-2 border-t border-gray-100 dark:border-slate-800"
          >
            {block.text}
          </h3>
        );
      }
      if (block.type === "quote") {
        return (
          <blockquote
            key={idx}
            className="p-5 my-3 border-l-4 border-black dark:border-white bg-gray-50 dark:bg-slate-900 rounded-r-xl italic text-gray-800 dark:text-gray-200 font-medium leading-relaxed"
          >
            {block.text}
          </blockquote>
        );
      }
      return (
        <p key={idx} className="whitespace-pre-line leading-relaxed">
          {block.text}
        </p>
      );
    });
  };

  return (
    <div className="pt-8 pb-16 transition-colors duration-300 text-gray-800 dark:text-gray-100">
      {selectedPost ? (
        <div className="max-w-4xl mx-auto pt-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-6 mb-8 border-b border-gray-200 dark:border-slate-800">
            <button
              onClick={handleClosePost}
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <span>←</span> Back to all articles
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span>🔗</span> Share
              </button>
              <button
                onClick={(e) =>
                  handleLike(selectedPost._id || selectedPost.id, e)
                }
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  likedPosts[selectedPost._id || selectedPost.id]
                    ? "bg-red-50 dark:bg-red-950/40 border-red-300 text-red-600 dark:text-red-400"
                    : "border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>
                  {likedPosts[selectedPost._id || selectedPost.id]
                    ? "❤️"
                    : "🤍"}
                </span>
                <span>{selectedPost.likes || 0}</span>
              </button>
            </div>
          </div>

          <div className="mb-8">
            <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-black dark:bg-white text-white dark:text-black rounded-full mb-4">
              {selectedPost.category}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4">
              {selectedPost.title}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6 font-light">
              {selectedPost.summary}
            </p>

            <div className="flex items-center gap-3.5 py-4 border-y border-gray-200 dark:border-slate-800">
              <img
                src={
                  selectedPost.authorAvatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                }
                alt={selectedPost.author}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-300 dark:border-slate-700 shadow-xs"
              />
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {selectedPost.author}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedPost.authorRole} • {selectedPost.date} •{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {selectedPost.readTime}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl mb-10 shadow-lg border border-gray-200 dark:border-slate-800">
            <img
              src={selectedPost.image}
              alt={selectedPost.title}
              className="w-full h-auto max-h-[480px] object-cover"
            />
          </div>

          <div className="flex flex-col gap-5 text-base leading-relaxed text-gray-700 dark:text-gray-300 font-normal">
            {renderFormattedContent(selectedPost.content)}
          </div>

          <div className="mt-12 pt-6 border-t border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Share:
              </span>
              <button
                onClick={handleShare}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                Copy Link
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  selectedPost.title
                )}&url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                Twitter / X
              </a>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  selectedPost.title + " " + window.location.href
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                WhatsApp
              </a>
            </div>

            <button
              onClick={handleClosePost}
              className="px-6 py-2.5 text-xs font-bold uppercase bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-md"
            >
              Browse More Articles
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="pt-8 text-2xl text-center border-t border-gray-200 dark:border-slate-800">
            <Title text1={"TRENDYTEK"} text2={"BLOG & INSIGHTS"} />
            <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Explore the latest in tech innovations, smart buying tips, styling
              guides, and behind-the-scenes stories from our team.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mt-8">
            <div className="relative flex items-center shadow-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles by title, author, or keywords..."
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

          {!searchQuery && selectedCategory === "All" && featuredPost && (
            <div className="mt-12">
              <div
                onClick={() => handleOpenPost(featuredPost)}
                className="relative overflow-hidden bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group grid grid-cols-1 lg:grid-cols-12"
              >
                <div className="lg:col-span-7 overflow-hidden min-h-[280px] sm:min-h-[380px]">
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest bg-orange-500 text-white rounded-full">
                        ⭐ Featured Story
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {featuredPost.readTime}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {featuredPost.title}
                    </h3>

                    <p className="mt-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                      {featuredPost.summary}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          featuredPost.authorAvatar ||
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                        }
                        alt={featuredPost.author}
                        className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-slate-700"
                      />
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">
                          {featuredPost.author}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          {featuredPost.date}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-black dark:text-white uppercase tracking-wider group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Read Story <span>→</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-14">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Latest Articles ({filteredPosts.length})
              </h3>
            </div>

            {loading ? (
              <div className="py-20 text-center text-gray-400 animate-pulse">
                Loading articles...
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="py-16 text-center bg-gray-50 dark:bg-slate-900 border border-dashed border-gray-300 dark:border-slate-800 rounded-2xl">
                <p className="text-3xl mb-2">📰</p>
                <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  No articles found
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post) => {
                  const postId = post._id || post.id;
                  const isLiked = !!likedPosts[postId];
                  return (
                    <article
                      key={postId}
                      onClick={() => handleOpenPost(post)}
                      className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group"
                    >
                      <div>
                        <div className="relative overflow-hidden h-52 bg-gray-100 dark:bg-slate-800">
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                          />
                          <span className="absolute top-3 left-3 px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-black/80 backdrop-blur-md text-white rounded-full">
                            {post.category}
                          </span>
                          <button
                            onClick={(e) => handleLike(postId, e)}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-center text-xs hover:scale-110 active:scale-95 transition-all shadow-xs"
                          >
                            {isLiked ? "❤️" : "🤍"}
                          </button>
                        </div>

                        <div className="p-6">
                          <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-400 font-medium mb-2">
                            <span>{post.date}</span>
                            <span>•</span>
                            <span>{post.readTime}</span>
                          </div>

                          <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                            {post.title}
                          </h4>

                          <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                            {post.summary}
                          </p>
                        </div>
                      </div>

                      <div className="p-6 pt-0 flex items-center justify-between border-t border-gray-100 dark:border-slate-800 mt-4">
                        <div className="flex items-center gap-2.5 pt-4">
                          <img
                            src={
                              post.authorAvatar ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                            }
                            alt={post.author}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {post.author}
                          </span>
                        </div>
                        <span className="pt-4 text-xs font-bold text-black dark:text-white flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Read <span>→</span>
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-20">
        <NewsletterBox />
      </div>
    </div>
  );
};

export default Blog;
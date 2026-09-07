import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import axios from "axios";
import { toast } from "react-toastify";

const Profile = () => {
  const {
    token,
    backendUrl,
    navigate,
    currency,
    userImage,
    setUserImage,
    setUserName,
  } = useContext(ShopContext);

  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [country, setCountry] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Profile Picture Upload State
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(userImage || "");

  // 1. Fetch Profile Data from Backend
  const fetchProfileData = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const profileRes = await axios.post(
        backendUrl + "/api/user/get-profile",
        {},
        { headers: { token } }
      );

      if (profileRes.data.success && profileRes.data.user) {
        const u = profileRes.data.user;
        setName(u.name || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
        setStreet(u.address?.street || "");
        setCity(u.address?.city || "");
        setState(u.address?.state || "");
        setZipcode(u.address?.zipcode || "");
        setCountry(u.address?.country || "");

        if (u.image) {
          setPreviewImage(u.image);
          setUserImage(u.image);
          localStorage.setItem("userImage", u.image);
        }

        if (u.name) {
          setUserName(u.name);
          localStorage.setItem("userName", u.name);
        }
      }

      // Fetch Orders
      const ordersRes = await axios.post(
        backendUrl + "/api/order/userorders",
        {},
        { headers: { token } }
      );

      if (ordersRes.data.success) {
        setOrders(ordersRes.data.orders || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [token]);

  // Handle Photo Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
      setActiveTab("edit");
    }
  };

  // Handle Profile Update Submit
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (imageFile) {
        formData.append("image", imageFile);
      }
      formData.append("name", name.trim());
      formData.append("phone", phone.trim());
      formData.append(
        "address",
        JSON.stringify({
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          zipcode: zipcode.trim(),
          country: country.trim(),
        })
      );
      if (newPassword.trim()) {
        formData.append("newPassword", newPassword.trim());
      }

      const response = await axios.post(
        backendUrl + "/api/user/update-profile",
        formData,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Profile updated successfully!");

        if (response.data.user?.image) {
          setUserImage(response.data.user.image);
          setPreviewImage(response.data.user.image);
          localStorage.setItem("userImage", response.data.user.image);
        }

        if (response.data.user?.name) {
          setUserName(response.data.user.name);
          localStorage.setItem("userName", response.data.user.name);
        }

        setImageFile(null);
        setNewPassword("");
        setActiveTab("overview");
      } else {
        toast.error(response.data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="pt-10 pb-16 border-t min-h-[75vh]">
      {/* Header & Tabs */}
      <div className="flex flex-col items-start justify-between gap-4 mb-8 sm:flex-row sm:items-center">
        <div className="text-2xl sm:text-3xl">
          <Title text1={"MY"} text2={"ACCOUNT"} />
        </div>

        <div className="flex p-1 bg-gray-100 border border-gray-200 rounded-xl">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === "overview"
                ? "bg-white text-black shadow-sm"
                : "text-gray-500 hover:text-black"
            }`}
          >
            👤 Account Overview
          </button>
          <button
            onClick={() => setActiveTab("edit")}
            className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === "edit"
                ? "bg-white text-black shadow-sm"
                : "text-gray-500 hover:text-black"
            }`}
          >
            ✏️ Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Left Side: Avatar Card */}
        <div className="flex flex-col items-center p-8 text-center bg-white border border-gray-200 shadow-sm rounded-2xl h-fit">
          {/* Avatar with Camera Button Overlay */}
          <div className="relative mb-4 group/avatar">
            <div className="flex items-center justify-center text-3xl font-bold text-white bg-black border-4 border-gray-100 rounded-full shadow-lg w-28 h-28 overflow-hidden">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Profile"
                  className="object-cover w-full h-full"
                />
              ) : name ? (
                name.charAt(0).toUpperCase()
              ) : (
                "U"
              )}
            </div>

            {/* Change photo button */}
            <label
              htmlFor="avatarUpload"
              className="absolute bottom-0 right-0 flex items-center justify-center w-9 h-9 text-white transition-all bg-black rounded-full shadow-md cursor-pointer hover:bg-gray-800 hover:scale-110"
              title="Change Profile Photo"
            >
              📷
              <input
                type="file"
                id="avatarUpload"
                hidden
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          </div>

          <p className="text-[11px] font-bold text-blue-600 mb-2 cursor-pointer hover:underline">
            <label htmlFor="avatarUpload" className="cursor-pointer">
              Change Photo
            </label>
          </p>

          <h3 className="text-xl font-bold text-gray-900">{name || "Customer"}</h3>
          <p className="mb-1 text-sm text-gray-500">{email}</p>
          {phone && <p className="mb-4 text-xs font-medium text-gray-600">📞 {phone}</p>}

          <div className="w-full pt-4 mt-2 border-t border-gray-100 flex flex-col gap-2.5">
            <button
              onClick={() =>
                setActiveTab(activeTab === "overview" ? "edit" : "overview")
              }
              className="w-full py-2.5 text-xs sm:text-sm font-semibold text-white bg-black rounded-lg hover:bg-gray-800 transition-all shadow-sm"
            >
              {activeTab === "overview" ? "✏️ Edit Account Info" : "👀 View Overview"}
            </button>
            <button
              onClick={() => navigate("/orders")}
              className="w-full py-2.5 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
            >
              📦 My Orders ({orders.length})
            </button>
          </div>
        </div>

        {/* Right Side: Tab Content */}
        <div className="md:col-span-2">
          {activeTab === "overview" ? (
            /* TAB 1: OVERVIEW */
            <div className="flex flex-col gap-6">
              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="p-5 border border-gray-200 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Total Orders
                  </p>
                  <h4 className="mt-1 text-2xl font-bold text-gray-900">
                    {orders.length}
                  </h4>
                </div>

                <div className="p-5 border border-gray-200 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Paid Orders
                  </p>
                  <h4 className="mt-1 text-2xl font-bold text-green-600">
                    {orders.filter((o) => o.payment).length}
                  </h4>
                </div>

                <div className="grid col-span-2 p-5 border border-gray-200 bg-gray-50 rounded-xl sm:col-span-1">
                  <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Account Status
                  </p>
                  <h4 className="mt-1 text-sm font-bold text-blue-600 sm:text-base">
                    ✅ Active Customer
                  </h4>
                </div>
              </div>

              {/* Saved Address */}
              <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
                <div className="flex items-center justify-between pb-3 mb-3 border-b">
                  <h4 className="text-base font-bold text-gray-900">
                    📍 Default Shipping Address
                  </h4>
                  <button
                    onClick={() => setActiveTab("edit")}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Edit &rarr;
                  </button>
                </div>

                {street || city || country ? (
                  <div className="flex flex-col gap-1 text-sm text-gray-600">
                    <p className="font-semibold text-gray-800">{name}</p>
                    <p>{street}</p>
                    <p>
                      {[city, state, zipcode, country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <p className="mt-1 font-medium">📞 {phone || "No phone added"}</p>
                  </div>
                ) : (
                  <p className="text-xs italic text-gray-400">
                    No shipping address saved yet. Click "Edit Profile" to add one.
                  </p>
                )}
              </div>

              {/* Recent Orders Preview */}
              <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-bold text-gray-900">
                    Recent Orders
                  </h4>
                  <button
                    onClick={() => navigate("/orders")}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    View all &rarr;
                  </button>
                </div>

                {orders.length === 0 ? (
                  <p className="py-6 text-sm text-center text-gray-400">
                    You haven't placed any orders yet.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {orders.slice(0, 3).map((order, idx) => (
                      <div
                        key={idx}
                        onClick={() => navigate("/orders")}
                        className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-all"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-900">
                            Order #{order._id.slice(-6).toUpperCase()}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {order.items.length} item(s) •{" "}
                            {new Date(order.date).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-bold text-gray-900">
                            {currency}
                            {Number(order.amount).toLocaleString()}
                          </p>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              order.payment
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {order.status || (order.payment ? "Paid" : "Pending")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: EDIT PROFILE FORM */
            <form
              onSubmit={handleUpdateProfile}
              className="flex flex-col gap-5 p-6 bg-white border border-gray-200 shadow-sm sm:p-8 rounded-2xl"
            >
              <h4 className="pb-3 text-lg font-bold text-gray-900 border-b">
                ✏️ Edit Personal & Shipping Information
              </h4>

              {/* Photo Upload Notice */}
              {imageFile && (
                <div className="flex items-center gap-2 p-3 text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded-lg">
                  <span>📸 New photo selected!</span>
                  <span className="font-semibold">
                    Click "Save Changes" below to upload it.
                  </span>
                </div>
              )}

              {/* Name & Phone */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block mb-1 text-xs font-semibold text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-black font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-semibold text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +234 801 234 5678"
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Email (Read Only) */}
              <div>
                <label className="block mb-1 text-xs font-semibold text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3.5 py-2 text-sm text-gray-500 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed"
                />
              </div>

              {/* Address Section */}
              <div className="flex flex-col gap-4 pt-2 border-t border-gray-100">
                <p className="text-xs font-bold tracking-wider text-gray-700 uppercase">
                  Default Shipping Address
                </p>

                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-600">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="House/Apartment number and street name"
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-black"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-600">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-600">
                      State / Province
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State"
                      className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-600">
                      Zipcode / Postal Code
                    </label>
                    <input
                      type="text"
                      value={zipcode}
                      onChange={(e) => setZipcode(e.target.value)}
                      placeholder="Zipcode"
                      className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-600">
                      Country
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Country"
                      className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-black"
                    />
                  </div>
                </div>
              </div>

              {/* Password Change Option */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block mb-1 text-xs font-semibold text-gray-700">
                  New Password (Optional — leave blank to keep current password)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter at least 8 characters to change password"
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-black"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 text-sm font-bold text-white transition-all bg-black rounded-lg shadow-md hover:bg-gray-800 active:scale-95"
                >
                  {loading ? "Saving Changes..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className="px-6 py-3 text-sm font-semibold text-gray-700 transition-all bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
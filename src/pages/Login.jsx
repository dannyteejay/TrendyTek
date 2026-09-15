import React, { useContext, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";

const Login = () => {
  const [currentState, setCurrentState] = useState("Login"); // 'Login' | 'Sign Up' | 'Forgot Password' | 'Reset Password'
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmitHandler = async (event) => {
    if (event && event.preventDefault) event.preventDefault();
    setLoading(true);

    try {
      if (currentState === "Sign Up") {
        const response = await axios.post(`${backendUrl}/api/user/register`, {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        });
        if (response.data.success) {
          setToken(response.data.token);
          localStorage.setItem("token", response.data.token);
          toast.success("Account created successfully!");
          navigate("/");
        } else {
          toast.error(response.data.message);
        }
      } else if (currentState === "Login") {
        const response = await axios.post(`${backendUrl}/api/user/login`, {
          email: email.trim().toLowerCase(),
          password,
        });
        if (response.data.success) {
          setToken(response.data.token);
          localStorage.setItem("token", response.data.token);
          toast.success("Welcome back!");
          navigate("/");
        } else {
          toast.error(response.data.message);
        }
      } else if (currentState === "Forgot Password") {
        if (!email.trim()) {
          toast.error("Please enter your email address.");
          setLoading(false);
          return;
        }
        const response = await axios.post(`${backendUrl}/api/user/forgot-password`, {
          email: email.trim().toLowerCase(),
        });
        if (response.data.success) {
          toast.success("6-digit code sent to your email!");
          setCurrentState("Reset Password");
        } else {
          toast.error(response.data.message);
        }
      } else if (currentState === "Reset Password") {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail) {
          toast.error("Please enter your email address.");
          setLoading(false);
          return;
        }
        if (!otp.trim() || otp.trim().length !== 6) {
          toast.error("Please enter the 6-digit verification code.");
          setLoading(false);
          return;
        }
        if (newPassword.length < 8) {
          toast.error("New password must be at least 8 characters long.");
          setLoading(false);
          return;
        }
        const response =await axios.post(backendUrl + '/api/user/reset-password', {
          email: email, // 👈 makes sure your email is sent!
          otp,
          newPassword,
        });
        if (response.data.success) {
          toast.success("Password reset successful! Please sign in.");
          setPassword("");
          setNewPassword("");
          setOtp("");
          setCurrentState("Login");
        } else {
          toast.error(response.data.message);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800"
    >
      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="prata-regular text-3xl">
          {currentState === "Login"
            ? "Sign In"
            : currentState === "Sign Up"
            ? "Sign Up"
            : currentState === "Forgot Password"
            ? "Forgot Password"
            : "Reset Password"}
        </p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>

      {/* Subtitle */}
      {currentState === "Forgot Password" && (
        <p className="text-xs text-gray-500 text-center -mt-2 mb-2">
          Enter your email to receive a 6-digit verification code.
        </p>
      )}

      {currentState === "Reset Password" && (
        <p className="text-xs text-gray-500 text-center -mt-2 mb-2">
          Enter the 6-digit code sent to{" "}
          <span className="font-semibold text-gray-800">
            {email || "your email"}
          </span>{" "}
          and your new password.
        </p>
      )}

      {/* Sign Up: Name field */}
      {currentState === "Sign Up" && (
        <input
          onChange={(e) => setName(e.target.value)}
          value={name}
          type="text"
          className="w-full px-3 py-2 border border-gray-800 outline-none rounded"
          placeholder="Full Name"
          required
        />
      )}

      {/* Email field (Shown in Login, Sign Up, Forgot Password, or if email was lost) */}
      {(currentState === "Login" ||
        currentState === "Sign Up" ||
        currentState === "Forgot Password" ||
        (currentState === "Reset Password" && !email)) && (
        <input
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          type="email"
          className="w-full px-3 py-2 border border-gray-800 outline-none rounded"
          placeholder="Email Address"
          required
        />
      )}

      {/* Login & Sign Up: Password */}
      {(currentState === "Login" || currentState === "Sign Up") && (
        <input
          onChange={(e) => setPassword(e.target.value)}
          value={password}
          type="password"
          className="w-full px-3 py-2 border border-gray-800 outline-none rounded"
          placeholder="Password"
          required
        />
      )}

      {/* Reset Password: OTP & New Password */}
      {currentState === "Reset Password" && (
        <>
          {email && (
            <div className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs text-gray-600">
              <span>
                Email: <strong className="text-gray-900">{email}</strong>
              </span>
              <button
                type="button"
                onClick={() => setCurrentState("Forgot Password")}
                className="text-blue-600 hover:underline font-medium ml-2"
              >
                Change
              </button>
            </div>
          )}

          <input
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            value={otp}
            type="text"
            inputMode="numeric"
            maxLength={6}
            className="w-full px-3 py-2.5 border border-gray-800 outline-none rounded text-center tracking-widest text-xl font-bold"
            placeholder="6-Digit OTP"
            required
          />

          <input
            onChange={(e) => setNewPassword(e.target.value)}
            value={newPassword}
            type="password"
            className="w-full px-3 py-2 border border-gray-800 outline-none rounded"
            placeholder="New Password (min 8 characters)"
            required
          />
        </>
      )}

      {/* Navigation Links */}
      <div className="w-full flex justify-between text-sm mt-[-8px]">
        {currentState === "Login" && (
          <>
            <p
              onClick={() => setCurrentState("Forgot Password")}
              className="cursor-pointer text-gray-600 hover:text-black"
            >
              Forgot your password?
            </p>
            <p
              onClick={() => setCurrentState("Sign Up")}
              className="cursor-pointer text-gray-600 hover:text-black font-medium"
            >
              Create account
            </p>
          </>
        )}

        {currentState === "Sign Up" && (
          <>
            <p
              onClick={() => setCurrentState("Forgot Password")}
              className="cursor-pointer text-gray-600 hover:text-black"
            >
              Forgot your password?
            </p>
            <p
              onClick={() => setCurrentState("Login")}
              className="cursor-pointer text-gray-600 hover:text-black font-medium"
            >
              Login Here
            </p>
          </>
        )}

        {currentState === "Forgot Password" && (
          <>
            <p
              onClick={() => setCurrentState("Login")}
              className="cursor-pointer text-gray-600 hover:text-black font-medium"
            >
              ← Back to Sign In
            </p>
            <p
              onClick={() => setCurrentState("Sign Up")}
              className="cursor-pointer text-gray-600 hover:text-black"
            >
              Create account
            </p>
          </>
        )}

        {currentState === "Reset Password" && (
          <>
            <p
              onClick={() => setCurrentState("Login")}
              className="cursor-pointer text-gray-600 hover:text-black font-medium text-xs"
            >
              ← Back to Sign In
            </p>
            <p
              onClick={async () => {
                if (!email) {
                  setCurrentState("Forgot Password");
                  return;
                }
                toast.info("Resending code...");
                try {
                  const res = await axios.post(
                    `${backendUrl}/api/user/forgot-password`,
                    { email }
                  );
                  if (res.data.success) toast.success("New code sent to email!");
                } catch (err) {
                  toast.error(err.response?.data?.message || err.message);
                }
              }}
              className="cursor-pointer text-gray-600 hover:text-black font-medium text-xs"
            >
              Resend Code
            </p>
          </>
        )}
      </div>

      <button
        disabled={loading}
        className={`bg-black text-white font-medium uppercase tracking-wider text-xs sm:text-sm px-8 py-3 mt-4 rounded-md w-full active:scale-95 transition-all cursor-pointer ${
          loading ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-800"
        }`}
      >
        {loading
          ? "Please wait..."
          : currentState === "Login"
          ? "Sign In"
          : currentState === "Sign Up"
          ? "Sign Up"
          : currentState === "Forgot Password"
          ? "Send Verification Code"
          : "Reset Password"}
      </button>
    </form>
  );
};

export default Login;
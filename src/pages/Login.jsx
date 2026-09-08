import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, useSearchParams } from "react-router-dom";

const Login = () => {
  // Mode: 'Login' | 'Sign Up' | 'Forgot Password'
  const [currentState, setCurrentState] = useState("Login");
  
  // Forgot Password Steps: 'EMAIL_STEP' | 'RESET_STEP'
  const [forgotStep, setForgotStep] = useState("EMAIL_STEP");

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    token,
    setToken,
    backendUrl,
    setUserName,
    setUserEmail,
    setUserImage,
  } = useContext(ShopContext);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "";

  // Helper to redirect to checkout if coming from Cart, or home otherwise
  const handleSuccessfulAuth = () => {
    if (redirectPath === "place-order") {
      navigate("/place-order");
    } else {
      navigate("/");
    }
  };

  // Auto-redirect if already logged in
  useEffect(() => {
    if (token) {
      handleSuccessfulAuth();
    }
  }, [token, redirectPath]);

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      // 1. SIGN UP (REGISTER)
      if (currentState === "Sign Up") {
        const response = await axios.post(backendUrl + "/api/user/register", {
          name,
          email,
          password,
        });

        if (response.data.success) {
          setToken(response.data.token);
          localStorage.setItem("token", response.data.token);

          if (response.data.userName && setUserName) {
            setUserName(response.data.userName);
            localStorage.setItem("userName", response.data.userName);
          }
          if (response.data.userEmail) {
            if (setUserEmail) setUserEmail(response.data.userEmail);
            localStorage.setItem("userEmail", response.data.userEmail);
          }
          toast.success("Account created successfully!");
          handleSuccessfulAuth();
        } else {
          toast.error(response.data.message);
        }
      }

      // 2. SIGN IN (LOGIN)
      else if (currentState === "Login") {
        const response = await axios.post(backendUrl + "/api/user/login", {
          email,
          password,
        });

        if (response.data.success) {
          setToken(response.data.token);
          localStorage.setItem("token", response.data.token);

          if (response.data.userName && setUserName) {
            setUserName(response.data.userName);
            localStorage.setItem("userName", response.data.userName);
          }
          if (response.data.userEmail) {
            if (setUserEmail) setUserEmail(response.data.userEmail);
            localStorage.setItem("userEmail", response.data.userEmail);
          }
          if (response.data.userImage && setUserImage) {
            setUserImage(response.data.userImage);
            localStorage.setItem("userImage", response.data.userImage);
          }

          toast.success("Welcome back!");
          handleSuccessfulAuth();
        } else {
          toast.error(response.data.message);
        }
      }

      // 3. FORGOT PASSWORD - STEP 1: SEND OTP
      else if (currentState === "Forgot Password" && forgotStep === "EMAIL_STEP") {
        const response = await axios.post(backendUrl + "/api/user/forgot-password", {
          email,
        });

        if (response.data.success) {
          toast.success(response.data.message || "Verification code sent to your email!");
          setForgotStep("RESET_STEP");
        } else {
          toast.error(response.data.message);
        }
      }

      // 4. FORGOT PASSWORD - STEP 2: VERIFY OTP & RESET PASSWORD
      else if (currentState === "Forgot Password" && forgotStep === "RESET_STEP") {
        const response = await axios.post(backendUrl + "/api/user/reset-password", {
          email,
          otp,
          newPassword,
        });

        if (response.data.success) {
          toast.success("Password reset successfully! Please sign in with your new password.");
          setCurrentState("Login");
          setForgotStep("EMAIL_STEP");
          setPassword("");
          setOtp("");
          setNewPassword("");
        } else {
          toast.error(response.data.message);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800 dark:text-gray-200 pb-20 transition-colors duration-300"
    >
      {/* Title Header */}
      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="font-prata text-3xl font-bold text-gray-900 dark:text-white">
          {currentState === "Forgot Password"
            ? forgotStep === "EMAIL_STEP"
              ? "Forgot Password"
              : "Reset Password"
            : currentState}
        </p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800 dark:bg-gray-200" />
      </div>

      {/* Helper Banner when coming from Checkout */}
      {redirectPath === "place-order" && (
        <div className="w-full p-3 mb-1 text-center bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-300 shadow-2xs animate-fade-in">
          🔐 Please sign in or register to complete your checkout.
        </div>
      )}

      {/* Forgot Password Helper */}
      {currentState === "Forgot Password" && (
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 -mt-2 mb-2">
          {forgotStep === "EMAIL_STEP"
            ? "Enter your registered email address to receive a 6-digit reset code."
            : `Enter the 6-digit code sent to ${email} and your new password.`}
        </p>
      )}

      {/* 1. Name Input (Sign Up Only) */}
      {currentState === "Sign Up" && (
        <input
          onChange={(e) => setName(e.target.value)}
          value={name}
          type="text"
          className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all text-sm"
          placeholder="Full Name"
          required
        />
      )}

      {/* 2. Email Input */}
      {currentState !== "Forgot Password" || forgotStep === "EMAIL_STEP" ? (
        <input
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          type="email"
          className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all text-sm"
          placeholder="Email address"
          required
        />
      ) : null}

      {/* 3. Password Input (Login & Sign Up) */}
      {currentState !== "Forgot Password" && (
        <input
          onChange={(e) => setPassword(e.target.value)}
          value={password}
          type="password"
          className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all text-sm"
          placeholder="Password"
          required
        />
      )}

      {/* 4. Forgot Password Step 2 (OTP & New Password) */}
      {currentState === "Forgot Password" && forgotStep === "RESET_STEP" && (
        <>
          <input
            onChange={(e) => setOtp(e.target.value)}
            value={otp}
            type="text"
            maxLength={6}
            className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all text-center text-lg font-bold tracking-widest"
            placeholder="6-Digit Code"
            required
          />

          <input
            onChange={(e) => setNewPassword(e.target.value)}
            value={newPassword}
            type="password"
            minLength={8}
            className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all text-sm"
            placeholder="New Password (min 8 characters)"
            required
          />
        </>
      )}

      {/* 5. Navigation Links */}
      <div className="w-full flex justify-between text-xs mt-[-4px] text-gray-600 dark:text-gray-400">
        {currentState === "Login" ? (
          <>
            <p
              onClick={() => {
                setCurrentState("Forgot Password");
                setForgotStep("EMAIL_STEP");
              }}
              className="cursor-pointer hover:underline hover:text-black dark:hover:text-white transition-colors"
            >
              Forgot your password?
            </p>
            <p
              onClick={() => setCurrentState("Sign Up")}
              className="cursor-pointer font-semibold hover:underline hover:text-black dark:hover:text-white transition-colors"
            >
              Create a new account
            </p>
          </>
        ) : currentState === "Sign Up" ? (
          <>
            <p
              onClick={() => {
                setCurrentState("Forgot Password");
                setForgotStep("EMAIL_STEP");
              }}
              className="cursor-pointer hover:underline hover:text-black dark:hover:text-white transition-colors"
            >
              Forgot your password?
            </p>
            <p
              onClick={() => setCurrentState("Login")}
              className="cursor-pointer font-semibold hover:underline hover:text-black dark:hover:text-white transition-colors"
            >
              Already have an account? Sign In
            </p>
          </>
        ) : (
          <div className="w-full flex justify-between items-center">
            <p
              onClick={() => {
                setCurrentState("Login");
                setForgotStep("EMAIL_STEP");
              }}
              className="cursor-pointer font-semibold hover:underline hover:text-black dark:hover:text-white transition-colors"
            >
              &larr; Back to Sign In
            </p>
            {forgotStep === "RESET_STEP" && (
              <p
                onClick={() => setForgotStep("EMAIL_STEP")}
                className="cursor-pointer hover:underline hover:text-blue-500 transition-colors"
              >
                Resend Code
              </p>
            )}
          </div>
        )}
      </div>

      {/* 6. Submit Button */}
      <button
        disabled={loading}
        className={`w-full py-2.5 mt-4 text-xs sm:text-sm font-bold tracking-wider text-white uppercase transition-all bg-black dark:bg-white dark:text-black rounded shadow-md hover:bg-gray-800 dark:hover:bg-gray-200 active:scale-95 cursor-pointer ${
          loading ? "opacity-60 cursor-not-allowed" : ""
        }`}
      >
        {loading
          ? "Please wait..."
          : currentState === "Login"
          ? "Sign In"
          : currentState === "Sign Up"
          ? "Sign Up"
          : forgotStep === "EMAIL_STEP"
          ? "Send Reset Code"
          : "Reset Password"}
      </button>
    </form>
  );
};

export default Login;
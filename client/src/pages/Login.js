import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import image from "../static/images/bg2.jpg"
import { Link } from "react-router-dom";

function generateCaptcha(length = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let captcha = "";
  for (let i = 0; i < length; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return captcha;
}

function Login() {
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [userCaptcha, setUserCaptcha] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [serverError, setServerError] = useState(""); 
  const navigate = useNavigate();

  useEffect(() => {
    setCaptcha(generateCaptcha());
  }, []);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setUserCaptcha("");
  };

  const validate_email = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validate_password = (psw) => {
    var errors = [];
    var regex1 = /^.{8,16}$/;
    var regex2 = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9.,])(?!.*[.,]).+$/;
    if (!regex1.test(psw)) {
      errors.push("The password should contain from 8 to 16 characters.");
    }
    if (!regex2.test(psw)) {
      errors.push("The password must contain at least one uppercase letter, one lowercase letter, and one special character.");
    }
    return errors;
  };

  const validate = (email, password) => {
    let result = { emailValid: true, passwordErrors: [] };
    if (!validate_email(email)) result.emailValid = false;
    const passwordValidation = validate_password(password);
    if (passwordValidation.length > 0) result.passwordErrors = passwordValidation;
    return result;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = validate(email, password);
    let isValid = true;

    if (!result.emailValid || result.passwordErrors.length > 0) {
      setError(result);
      isValid = false;
    } else {
      setError(false);
    }

    if (userCaptcha.trim() !== captcha.trim()) {
      setCaptchaError("CAPTCHA does not match.");
      isValid = false;
    } else {
      setCaptchaError("");
    }

    if (isValid) {
      try {
        console.log("Attempting login...");
        const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });

        console.log("Response received:", res.data);

        // Ensure the backend returned the token and user object
        if (res.data.token && res.data.user) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
          localStorage.setItem("token", res.data.token);

          if (rememberMe) {
            localStorage.setItem("rememberedEmail", email);
          } else {
            localStorage.removeItem("rememberedEmail");
          }

          console.log("Login Success, redirecting to Dashboard...");
          navigate("/dashboard");
        } else {
          console.error("Backend did not return token or user data");
          setServerError("Login failed: Missing security token from server.");
        }

      } catch (err) {
        console.error("Login Error:", err);
        setServerError(err.response?.data?.message || "Login failed. Please check your credentials.");
        refreshCaptcha(); 
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f0e13] text-white font-sans p-6 lg:p-10">
      <div className="hidden lg:block lg:w-1/2 relative rounded-3xl overflow-hidden shadow-2xl">
        <img
          src={image}
          alt="Login Visual"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-4 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Login</h1>
            <p className="text-sm text-gray-400">
              Don't have an account? <Link to="/signup" className="text-[#7c66ff] hover:underline font-medium">Sign Up</Link>
            </p>
          </div>

          {serverError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <input
                type="email"
                placeholder="Email address"
                className="w-full bg-[#1c1b22] border border-white/5 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-[#7c66ff] transition"
                value={email}
                onChange={(e) => {
                    setEmail(e.target.value);
                    setServerError("");
                }}
              />
              {error && error.emailValid === false && (
                <p className="text-red-400 text-xs ml-1">Invalid email address.</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="relative">
                <input
                  type={visible ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full bg-[#1c1b22] border border-white/5 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-[#7c66ff] transition"
                  value={password}
                  onChange={(e) => {
                      setPassword(e.target.value);
                      setServerError("");
                  }}
                />
                <button
                  type="button"
                  className="absolute right-4 top-4 text-gray-500 hover:text-white text-xs"
                  onClick={() => setVisible((prev) => !prev)}
                >
                  {visible ? "HIDE" : "SHOW"}
                </button>
              </div>
              {error && error.passwordErrors && error.passwordErrors.map((err, index) => (
                <p key={index} className="text-red-400 text-xs mt-1 ml-1">{err}</p>
              ))}
            </div>

            <div className="flex items-center gap-3 bg-[#1c1b22] p-2 rounded-xl border border-white/5">
              <div className="bg-[#25242b] px-4 py-2 rounded-lg font-mono text-[#7c66ff] font-bold tracking-widest text-sm">
                {captcha}
              </div>
              <input
                type="text"
                placeholder="Enter captcha"
                className="flex-1 bg-transparent px-2 focus:outline-none text-sm border-b border-white/10 focus:border-[#7c66ff] py-1"
                value={userCaptcha}
                onChange={(e) => setUserCaptcha(e.target.value)}
              />
              <button
                type="button"
                onClick={refreshCaptcha}
                className="text-gray-500 hover:text-white text-lg pr-2 transition"
              >
                ↻
              </button>
            </div>
            {captchaError && <p className="text-red-400 text-xs ml-1">{captchaError}</p>}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded bg-[#1c1b22] border-white/10 text-[#7c66ff] focus:ring-0 focus:ring-offset-0"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-400 cursor-pointer">Remember Me</label>
            </div>

            <button
              type="submit"
              className="w-full bg-[#7c66ff] hover:bg-[#6b55e6] text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] mt-2"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
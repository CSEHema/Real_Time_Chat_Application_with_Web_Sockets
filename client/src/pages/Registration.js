import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { isValidPhoneNumber } from 'libphonenumber-js';
import image from '../static/images/bg1.jpg';
import axios from 'axios';

function generateCaptcha(length = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let captcha = "";
  for (let i = 0; i < length; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return captcha;
}

function Registration() {
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phno, setPhno] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [userCaptcha, setUserCaptcha] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [serverError, setServerError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setCaptcha(generateCaptcha());
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

  const validate = (email, password, phno) => {
    let result = { emailValid: true, passwordErrors: [], phErrors: [] };
    if (!validate_email(email)) result.emailValid = false;
    if (!isValidPhoneNumber(`+${phno}`)) result.phErrors.push('Invalid Phone Number');
    const passwordValidation = validate_password(password);
    if (passwordValidation.length > 0) result.passwordErrors = passwordValidation;
    return result;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validate(email, password, phno);
    let isValid = true;

    if (!result.emailValid || result.passwordErrors.length > 0 || result.phErrors.length > 0) {
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
      axios.post('http://localhost:5000/api/auth/register', { name, email, password, phno })
        .then((response) => {
          localStorage.setItem("user", JSON.stringify(response.data.user));
          localStorage.setItem("token", response.data.token);
          navigate("/dashboard");
        })
        .catch((error) => {
          const errMsg = error.response?.data?.error || "Registration failed";
          setServerError(errMsg);
          refreshCaptcha();
        });
    }
  };

  return (
    // Replaced #0f0e13 with deepdark
    <div className="flex min-h-screen bg-deepdark text-white font-sans p-6 lg:p-10">
      
      {/* LEFT SECTION: IMAGE */}
      <div className="hidden lg:block lg:w-1/2 relative rounded-3xl overflow-hidden shadow-2xl">
        <img 
          src={image} 
          alt="Registration Visual" 
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* RIGHT SECTION: FORM */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-4 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Create an account</h1>
            <p className="text-sm text-gray-400">
              Already have an account? <a href="/" className="text-vibrantpurple hover:underline">Log in</a>
            </p>
          </div>

          {serverError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <input
              type="text"
              placeholder="Name"
              // Replaced #1c1b22 with darkpurple
              className="w-full bg-darkpurple border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-vibrantpurple transition"
              value={name}
              onChange={(e) => {setName(e.target.value); setServerError("");}}
              required
            />

            {/* Email */}
            <div className="space-y-1">
              <input
                type="email"
                placeholder="Email"
                className="w-full bg-darkpurple border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-vibrantpurple transition"
                value={email}
                onChange={(e) => {setEmail(e.target.value); setServerError("");}}
              />
              {error && error.emailValid === false && (
                <p className="text-red-500 text-xs ml-1">Invalid email address.</p>
              )}
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type={visible ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full bg-darkpurple border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-vibrantpurple transition"
                value={password}
                onChange={(e) => {setPassword(e.target.value); setServerError("");}}
              />
              <button
                type="button"
                className="absolute right-4 top-3.5 text-gray-500 text-xs"
                onClick={() => setVisible(!visible)}
              >
                {visible ? "HIDE" : "SHOW"}
              </button>
              {error && error.passwordErrors && error.passwordErrors.map((err, index) => (
                <p key={index} className="text-red-400 text-xs mt-1 ml-1">{err}</p>
              ))}
            </div>

            {/* Phone Input */}
            <div className="phone-dark-simple">
              <PhoneInput
                country={'in'}
                value={phno}
                onChange={setPhno}
                // Updated styles to match darkpurple and white/5 border
                inputStyle={{ width: '100%', height: '48px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: '#1c1b22', color: 'white' }}
                buttonStyle={{ background: '#1c1b22', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px 0 0 12px' }}
                dropdownStyle={{ background: '#1c1b22', color: 'white' }}
              />
              {error && error.phErrors && error.phErrors.map((err, index) => (
                <p key={index} className="text-red-400 text-xs mt-1 ml-1">{err}</p>
              ))}
            </div>

            {/* Captcha */}
            <div className="flex items-center gap-3 bg-darkpurple p-2 rounded-xl border border-white/5">
              {/* Replaced #25242b with lightdark */}
              <div className="bg-lightdark px-4 py-2 rounded-lg font-mono text-vibrantpurple font-bold tracking-widest text-sm">
                {captcha}
              </div>
              <input 
                type="text" 
                placeholder="Enter captcha"
                className="flex-1 bg-transparent px-2 focus:outline-none text-sm border-b border-white/10 focus:border-vibrantpurple py-1"
                value={userCaptcha}
                onChange={(e) => setUserCaptcha(e.target.value)}
              />
              <button type="button" onClick={refreshCaptcha} className="text-gray-500 hover:text-white text-lg pr-2">↻</button>
            </div>
            {captchaError && <p className="text-red-400 text-xs ml-1">{captchaError}</p>}

            {/* Terms */}
            <div className="flex items-center gap-3 py-2">
              <input 
                type="checkbox" 
                id="terms" 
                className="w-4 h-4 rounded bg-darkpurple border-white/10 text-vibrantpurple focus:ring-0" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                required
              />
              <label htmlFor="terms" className="text-xs text-gray-400">
                I agree to the <span className="text-white hover:underline cursor-pointer">Terms & Conditions</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-vibrantpurple hover:bg-[#6b55e6] text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg active:scale-[0.98]"
            >
              Create account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Registration;
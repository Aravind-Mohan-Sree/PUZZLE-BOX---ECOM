const otpGenerator = require('otp-generator');

// generates OTP using otp-generator module
const generateOtp = () => {
  const otp = otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false
  });

  return otp;
};

module.exports = generateOtp;
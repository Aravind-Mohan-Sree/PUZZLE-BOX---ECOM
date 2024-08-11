const otpGenerator = require('otp-generator');

// this will generate an OTP containing 6 digits
const generateOtp = () => {
  const otp = otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false
  });

  return otp;
}

module.exports = generateOtp;
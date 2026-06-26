module.exports = {
  accessTokenSecret: process.env.JWT_SECRET,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET,

  accessTokenExpiry: "15m",
  refreshTokenExpiry: "30d",
};
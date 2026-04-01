const config = {
  appName: "Lemoto",
  appDescription:
    "Lemoto is your smart ride weather companion that tells you exactly when it's perfect to ride.",
  
  // URLs for different environments
  marketingUrl: process.env.NEXT_PUBLIC_MARKETING_URL || "http://localhost:3000",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  domain: process.env.NEXT_PUBLIC_DOMAIN || "lemoto.com",
  cookieDomain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || ".lemoto.com",
  
  // Legacy domainName for backward compatibility
  domainName: process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.NODE_ENV === "development" 
      ? "http://localhost:3000" 
      : "https://app.lemoto.com"),
};

export default config;

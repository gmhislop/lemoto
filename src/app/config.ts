const config = {
  appName: "Lemoto",
  appDescription:
    "Lemoto is a platform that helps you create and manage your own blog.",
  domainName:
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://lemoto.app",
};

export default config;

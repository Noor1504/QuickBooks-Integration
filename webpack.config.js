const path = require("path");

module.exports = (env, argv) => {
  // const isDevelopment = argv.mode === "production";

  return {
    entry: "./app.cjs", // Your entry file
    output: {
      filename: "bundle.js",
      path: path.resolve(__dirname, "dist"),
    },
    resolve: {
      fallback: {
        url: require.resolve("url/"),
        https: require.resolve("https-browserify"),
        assert: require.resolve("assert/"),
        http: require.resolve("stream-http"),
        net: require.resolve("net-browserify"),
        tls: require.resolve("tls-browserify"),
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        zlib: require.resolve("browserify-zlib"),
        querystring: require.resolve("querystring-es3"),
        timers: require.resolve("timers-browserify"),
      },
    },
    // ... other config options
    // target: isDevelopment ? "web" : "node",
    optimization: {
      minimize: false,
    },
    // node: {
    //   __dirname: false,
    //   __filename: false,
    // },
  };
};

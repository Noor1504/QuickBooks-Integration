const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (env, argv) => {
  return {
    entry: "./app.cjs", // Your entry file
    output: {
      filename: "bundle.js",
      path: path.resolve(__dirname, "build"),
    },
    plugins: [
      new HtmlWebpackPlugin({
        title: "QuickBooks Integration", 
      }),
    ],
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
    target: "node",
    optimization: {
      minimize: false,
    },
    mode: "development",
    externals: {
      express: "express",
    },
  };
};

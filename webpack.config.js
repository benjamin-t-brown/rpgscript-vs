const path = require('path');

const extensionConfig = {
  target: 'node',
  mode: 'none',

  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
  },
  externals: {
    vscode: 'commonjs vscode',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: 'log',
  },
};

// Ship a self-contained server: .vscodeignore excludes src and node_modules.
const serverConfig = {
  ...extensionConfig,
  entry: './src/server/src/server.ts',
  output: {
    ...extensionConfig.output,
    filename: 'server.js',
  },
};

module.exports = [extensionConfig, serverConfig];

const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      contextIsolation: false,
      mainProcessFile: 'src/MainProcess/ProcessoPrincipal.js',
      rendererProcessFile: 'src/RendererProcess/InicioVue.js',
      chainWebpackMainProcess: config => {
        config.module
          .rule('babel')
          .test(/\.(js|mjs|jsx|ts|tsx)$/)
          .use('babel')
          .loader('babel-loader')
          .options({
            presets: [['@babel/preset-env', { modules: false }]],
            plugins: ['@babel/plugin-proposal-class-properties']
          })
      }
    }
  }
})

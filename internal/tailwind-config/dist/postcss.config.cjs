const { createJiti } = require("../../../node_modules/.pnpm/jiti@2.6.1/node_modules/jiti/lib/jiti.cjs")

const jiti = createJiti(__filename, {
  "interopDefault": true,
  "alias": {
    "@vben/tailwind-config": "/home/finn/data/workspace/oh-web/internal/tailwind-config"
  },
  "transformOptions": {
    "babel": {
      "plugins": []
    }
  }
})

/** @type {import("/home/finn/data/workspace/oh-web/internal/tailwind-config/src/postcss.config.js")} */
module.exports = jiti("/home/finn/data/workspace/oh-web/internal/tailwind-config/src/postcss.config.ts")
import { createJiti } from "../../../../node_modules/.pnpm/jiti@2.6.1/node_modules/jiti/lib/jiti.mjs";

const jiti = createJiti(import.meta.url, {
  "interopDefault": true,
  "alias": {
    "@vben/eslint-config": "/home/finn/data/workspace/oh-web/internal/lint-configs/eslint-config"
  },
  "transformOptions": {
    "babel": {
      "plugins": []
    }
  }
})

/** @type {import("/home/finn/data/workspace/oh-web/internal/lint-configs/eslint-config/src/index.js")} */
const _module = await jiti.import("/home/finn/data/workspace/oh-web/internal/lint-configs/eslint-config/src/index.ts");

export const defineConfig = _module.defineConfig;
import { createJiti } from "../../../node_modules/.pnpm/jiti@2.6.1/node_modules/jiti/lib/jiti.mjs";

const jiti = createJiti(import.meta.url, {
  "interopDefault": true,
  "alias": {
    "@vben/turbo-run": "/home/finn/data/workspace/oh-web/scripts/turbo-run"
  },
  "transformOptions": {
    "babel": {
      "plugins": []
    }
  }
})

/** @type {import("/home/finn/data/workspace/oh-web/scripts/turbo-run/src/index.js")} */
const _module = await jiti.import("/home/finn/data/workspace/oh-web/scripts/turbo-run/src/index.ts");

export default _module?.default ?? _module;
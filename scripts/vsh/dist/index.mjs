import { createJiti } from "../../../node_modules/.pnpm/jiti@2.6.1/node_modules/jiti/lib/jiti.mjs";

const jiti = createJiti(import.meta.url, {
  "interopDefault": true,
  "alias": {
    "@vben/vsh": "/home/finn/data/workspace/oh-web/scripts/vsh"
  },
  "transformOptions": {
    "babel": {
      "plugins": []
    }
  }
})

/** @type {import("/home/finn/data/workspace/oh-web/scripts/vsh/src/index.js")} */
const _module = await jiti.import("/home/finn/data/workspace/oh-web/scripts/vsh/src/index.ts");

export default _module?.default ?? _module;
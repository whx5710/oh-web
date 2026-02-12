import { createJiti } from "../../../../../node_modules/.pnpm/jiti@2.6.1/node_modules/jiti/lib/jiti.mjs";

const jiti = createJiti(import.meta.url, {
  "interopDefault": true,
  "alias": {
    "@vben-core/shared": "/home/finn/data/workspace/oh-web/packages/@core/base/shared"
  },
  "transformOptions": {
    "babel": {
      "plugins": []
    }
  }
})

/** @type {import("/home/finn/data/workspace/oh-web/packages/@core/base/shared/src/global-state.js")} */
const _module = await jiti.import("/home/finn/data/workspace/oh-web/packages/@core/base/shared/src/global-state.ts");

export const globalShareState = _module.globalShareState;
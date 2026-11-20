/**
 * Shared editor bundle, registered as the "codexa-blocks-editor" script.
 *
 * Defines window.codexaBlocks, the shared editor package that blocks
 * import as "@codexa-blocks/editor" (see webpack.config.js). Frozen so
 * no block can overwrite a shared export at runtime. Also loads the styles
 * of the shared controls (editor.scss).
 */
import * as editorPackage from "../shared/index.js";
import "./editor.scss";

window.codexaBlocks = Object.freeze({ ...editorPackage });

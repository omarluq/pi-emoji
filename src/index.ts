import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerEmojiEditor } from "./editor.ts";
import { registerEmojiCommand } from "./picker.ts";
import { transformEmojiShortcodes } from "./shortcodes.ts";

export default function emojiShortcodes(pi: ExtensionAPI): void {
  pi.registerMarkdownTransformer(transformEmojiShortcodes);
  registerEmojiCommand(pi);
  registerEmojiEditor(pi);
}

import { registerEmojiCommand, type EmojiCommandRegistrar } from "./picker.ts";
import { transformEmojiShortcodes } from "./shortcodes.ts";

type PiExtension = EmojiCommandRegistrar & {
  registerMarkdownTransformer(transformer: (markdown: string) => string): void;
};

export default function emojiShortcodes(pi: PiExtension): void {
  pi.registerMarkdownTransformer(transformEmojiShortcodes);
  registerEmojiCommand(pi);
}

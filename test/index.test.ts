import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { visibleWidth } from "@earendil-works/pi-tui";
import emojiShortcodes from "../index.ts";
import { frameEmojiModal } from "../src/frame.ts";
import { renderPromptEmojiShortcodes } from "../src/editor.ts";
import { emojiItems, transformEmojiShortcodes } from "../src/shortcodes.ts";

const markdown = [
  "Hello :wave: :unknown_shortcode:",
  "Inline `:smile:` and :sparkles:",
  "```ts",
  "const mood = ':heart:';",
  "```",
  "Done :+1:",
].join("\n");

const expected = [
  "Hello 👋 :unknown_shortcode:",
  "Inline `:smile:` and ✨",
  "```ts",
  "const mood = ':heart:';",
  "```",
  "Done 👍",
].join("\n");
const actual = transformEmojiShortcodes(markdown);
const prompt = renderPromptEmojiShortcodes("Hello :wave: :unknown_shortcode:");
if (prompt !== "Hello 👋 :unknown_shortcode:") {
  throw new Error(`Prompt emoji rendering failed: ${JSON.stringify(prompt)}`);
}

if (actual !== expected)
  throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);

if (
  emojiItems.length < 1_500 ||
  !emojiItems.some((item) => item.value === "wave" && item.label.includes("👋"))
) {
  throw new Error("Emoji picker items are incomplete");
}

const backgrounds: string[] = [];
const backgroundStart = "\x1b[48;2;1;2;3m";
const backgroundEnd = "\x1b[49m";
const ansiColors = (text: string) =>
  text
    .split("\x1b[38;2;")
    .slice(1)
    .map((segment) => segment.slice(0, segment.indexOf("m")));
const frame = frameEmojiModal(["x"], 8, (text) => {
  backgrounds.push(text);
  return `${backgroundStart}${text}${backgroundEnd}`;
});
const baseFrame = frameEmojiModal(["x"], 8, (text) => text);
const shiftedFrame = frameEmojiModal(["x"], 8, (text) => text, 1);
const topColors = ansiColors(baseFrame[0] ?? "");
const sideColors = ansiColors(baseFrame[1] ?? "");
const bottomColors = ansiColors(baseFrame[2] ?? "");
const palette = topColors.slice(0, 6);
const clockwiseColors = [
  ...topColors,
  sideColors[1],
  ...[...bottomColors].reverse(),
  sideColors[0],
];
if (
  frame.length !== 3 ||
  frame.some((line) => visibleWidth(line) !== 8) ||
  frame.some((line) => !line.startsWith(backgroundStart) || !line.endsWith(backgroundEnd)) ||
  backgrounds.length !== frame.length ||
  backgrounds.some((line) => visibleWidth(line) !== 8) ||
  !baseFrame[0]?.includes("╭") ||
  !baseFrame[0]?.includes("╮") ||
  !baseFrame[1]?.includes("│") ||
  !baseFrame[2]?.includes("╰") ||
  !baseFrame[2]?.includes("╯") ||
  topColors.length !== 8 ||
  sideColors.length !== 2 ||
  bottomColors.length !== 8 ||
  clockwiseColors.some((color, index) => color !== palette[index % palette.length]) ||
  baseFrame[0] === shiftedFrame[0] ||
  !frame[0]?.includes("\x1b[38;2;")
) {
  throw new Error("Emoji modal frame is malformed");
}

let registeredCommand = "";
let sessionStartHandler: ((event: { reason: "startup" | "reload" }, ctx: any) => void) | undefined;
emojiShortcodes({
  on(event: string, handler: unknown) {
    if (event === "session_start") {
      sessionStartHandler = handler as typeof sessionStartHandler;
    }
  },
  registerMarkdownTransformer() {},
  registerCommand(name: string) {
    registeredCommand = name;
  },
} as unknown as ExtensionAPI);
if (registeredCommand !== "emoji") throw new Error("/emoji command was not registered");
if (!sessionStartHandler) throw new Error("Prompt emoji renderer was not registered");

let editorInstallations = 0;
let installedEditorFactory: unknown;
const editorContext = {
  mode: "tui",
  ui: {
    getEditorComponent: () => installedEditorFactory,
    setEditorComponent: (factory: unknown) => {
      editorInstallations += 1;
      installedEditorFactory = factory;
    },
  },
};
sessionStartHandler({ reason: "startup" }, editorContext);
if (editorInstallations !== 1) throw new Error("Prompt emoji renderer missed session startup");

const competingEditorFactory = () => ({});
editorContext.ui.setEditorComponent(competingEditorFactory);
if (Number(editorInstallations) !== 2 || installedEditorFactory === competingEditorFactory) {
  throw new Error("Prompt emoji renderer did not wrap a competing editor");
}

console.log("emoji shortcode rendering ok");

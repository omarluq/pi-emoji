import { Input, SelectList } from "@earendil-works/pi-tui";
import { frameEmojiModal } from "./frame.ts";
import { emojiItems } from "./shortcodes.ts";

type EmojiPopup = {
  focused: boolean;
  render(width: number): string[];
  handleInput(data: string): void;
  invalidate(): void;
  dispose(): void;
};

type EmojiOverlayOptions = {
  overlay: true;
  overlayOptions: {
    anchor: "center";
    width: number;
    maxHeight: number;
    margin: number;
  };
};

type EmojiCommandContext = {
  ui: {
    custom<T>(
      factory: (
        tui: { requestRender(): void },
        theme: {
          fg(color: string, text: string): string;
          bg(color: string, text: string): string;
        },
        keybindings: { matches(data: string, id: string): boolean },
        done: (value: T) => void,
      ) => EmojiPopup,
      options?: EmojiOverlayOptions,
    ): Promise<T | undefined>;
    getEditorText(): string;
    setEditorText(text: string): void;
  };
};

export type EmojiCommandRegistrar = {
  registerCommand(
    name: string,
    options: {
      description: string;
      handler(args: string, ctx: EmojiCommandContext): Promise<void>;
    },
  ): void;
};

const SHIMMER_INTERVAL_MS = 80;
const PICKER_KEYS = ["tui.select.up", "tui.select.down", "tui.select.confirm", "tui.select.cancel"];

export function registerEmojiCommand(pi: EmojiCommandRegistrar): void {
  pi.registerCommand("emoji", {
    description: "Browse emoji shortcodes",
    async handler(_args, ctx) {
      const shortcode = await ctx.ui.custom<string | null>(
        (tui, theme, keybindings, done) => {
          const input = new Input();
          const list = new SelectList(emojiItems, 10, {
            selectedPrefix: (text) => theme.fg("accent", text),
            selectedText: (text) => theme.fg("accent", text),
            description: (text) => text,
            scrollInfo: (text) => theme.fg("dim", text),
            noMatch: (text) => theme.fg("warning", text),
          });

          list.onSelect = (item) => done(`:${item.value}:`);
          list.onCancel = () => done(null);

          let shimmerPhase = 0;
          const shimmerTimer = setInterval(() => {
            shimmerPhase += 1;
            tui.requestRender();
          }, SHIMMER_INTERVAL_MS);
          let focused = false;
          return {
            get focused() {
              return focused;
            },
            set focused(value: boolean) {
              focused = value;
              input.focused = value;
            },
            render(width) {
              const innerWidth = Math.max(1, width - 2);
              return frameEmojiModal(
                [
                  theme.fg("accent", " Emoji — type to filter"),
                  ...input.render(innerWidth),
                  ...list.render(innerWidth),
                ],
                width,
                (text) => theme.bg("customMessageBg", text),
                shimmerPhase,
              );
            },
            handleInput(data) {
              if (PICKER_KEYS.some((key) => keybindings.matches(data, key))) {
                list.handleInput(data);
              } else {
                input.handleInput(data);
                list.setFilter(input.getValue());
              }
              tui.requestRender();
            },
            invalidate() {
              input.invalidate();
              list.invalidate();
            },
            dispose() {
              clearInterval(shimmerTimer);
            },
          };
        },
        {
          overlay: true,
          overlayOptions: {
            anchor: "center",
            width: 52,
            maxHeight: 18,
            margin: 1,
          },
        },
      );

      if (!shortcode) return;
      const current = ctx.ui.getEditorText();
      const spacer = current && !/\s$/.test(current) ? " " : "";
      ctx.ui.setEditorText(`${current}${spacer}${shortcode}`);
    },
  });
}

import {
  CustomEditor,
  type ExtensionAPI,
  type ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import type { EditorComponent } from "@earendil-works/pi-tui";
import { emojify } from "node-emoji";

export const renderPromptEmojiShortcodes = emojify;

const emojiWrapped = Symbol("pi-emoji wrapped");
let restoreSetEditorComponent: (() => void) | undefined;

type EditorFactory = NonNullable<Parameters<ExtensionContext["ui"]["setEditorComponent"]>[0]>;
type WrappedEditor = EditorComponent & { [emojiWrapped]?: true };
type WrappedFactory = EditorFactory & { [emojiWrapped]?: true };

function wrapEditor(editor: EditorComponent): EditorComponent {
  const wrapped = editor as WrappedEditor;
  if (wrapped[emojiWrapped]) return editor;

  const render = editor.render.bind(editor);
  editor.render = (width) => render(width).map((line) => renderPromptEmojiShortcodes(line));
  wrapped[emojiWrapped] = true;
  return editor;
}

function wrapEditorFactory(factory: EditorFactory): EditorFactory {
  const wrapped = factory as WrappedFactory;
  if (wrapped[emojiWrapped]) return factory;

  const wrappedFactory: WrappedFactory = (tui, theme, keybindings) =>
    wrapEditor(factory(tui, theme, keybindings));
  wrappedFactory[emojiWrapped] = true;
  return wrappedFactory;
}

function installEmojiEditor(ctx: ExtensionContext): void {
  if (ctx.mode !== "tui") return;

  restoreSetEditorComponent?.();
  const originalSetEditorComponent = ctx.ui.setEditorComponent;
  const defaultFactory: EditorFactory = (tui, theme, keybindings) =>
    new CustomEditor(tui, theme, keybindings);
  const setEmojiEditor = (factory: EditorFactory | undefined) =>
    originalSetEditorComponent.call(ctx.ui, wrapEditorFactory(factory ?? defaultFactory));

  ctx.ui.setEditorComponent = setEmojiEditor;
  restoreSetEditorComponent = () => {
    if (ctx.ui.setEditorComponent === setEmojiEditor) {
      ctx.ui.setEditorComponent = originalSetEditorComponent;
    }
  };

  setEmojiEditor(ctx.ui.getEditorComponent());
}

export function registerEmojiEditor(pi: ExtensionAPI): void {
  pi.on("session_start", (_event, ctx) => installEmojiEditor(ctx));
  pi.on("session_shutdown", () => {
    restoreSetEditorComponent?.();
    restoreSetEditorComponent = undefined;
  });
}

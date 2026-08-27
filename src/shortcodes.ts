import { emojify, search } from "node-emoji";

export const emojiItems = search("").map(({ emoji, name }) => ({
  value: name,
  label: `${emoji}  :${name}:`,
}));

function transformInlineCode(line: string): string {
  let result = "";
  let textStart = 0;

  for (let i = 0; i < line.length; i++) {
    if (line[i] !== "`") continue;

    let end = i + 1;
    while (line[end] === "`") end++;

    const marker = line.slice(i, end);
    const close = line.indexOf(marker, end);
    if (close === -1) continue;

    result += emojify(line.slice(textStart, i));
    result += line.slice(i, close + marker.length);
    textStart = close + marker.length;
    i = textStart - 1;
  }

  return result + emojify(line.slice(textStart));
}

export function transformEmojiShortcodes(markdown: string): string {
  let fence: { marker: string; length: number } | undefined;

  return markdown
    .split("\n")
    .map((line) => {
      const marker = line.match(/^ {0,3}(`{3,}|~{3,})/)?.[1];

      if (fence) {
        if (
          marker?.[0] === fence.marker &&
          marker.length >= fence.length &&
          /^ {0,3}(`+|~+)\s*$/.test(line)
        ) {
          fence = undefined;
        }
        return line;
      }

      if (marker) {
        fence = { marker: marker[0], length: marker.length };
        return line;
      }

      return transformInlineCode(line);
    })
    .join("\n");
}

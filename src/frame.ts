import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

const RAINBOW = [
  [255, 92, 92],
  [255, 184, 77],
  [255, 235, 87],
  [105, 240, 174],
  [91, 192, 255],
  [181, 126, 255],
] as const;

function rainbowBorder(text: string, offset = 0, step = 1): string {
  return (
    [...text]
      .map((character, index) => {
        const colorIndex = (offset + index * step) % RAINBOW.length;
        const [red, green, blue] = RAINBOW[colorIndex];
        return `\x1b[38;2;${red};${green};${blue}m${character}`;
      })
      .join("") + "\x1b[39m"
  );
}

export function frameEmojiModal(
  lines: string[],
  width: number,
  background: (text: string) => string,
  phase = 0,
): string[] {
  if (width < 3) {
    return [background(rainbowBorder("─".repeat(Math.max(0, width)), phase))];
  }

  const innerWidth = width - 2;
  const perimeter = 2 * width + 2 * lines.length;
  const framed = lines.map((line, row) => {
    const clipped = truncateToWidth(line, innerWidth, "");
    const padded = clipped + " ".repeat(innerWidth - visibleWidth(clipped));
    const left = rainbowBorder("│", phase + perimeter - 1 - row);
    const right = rainbowBorder("│", phase + width + row);
    return background(`${left}${padded}${right}`);
  });

  return [
    background(rainbowBorder(`╭${"─".repeat(innerWidth)}╮`, phase)),
    ...framed,
    background(
      rainbowBorder(`╰${"─".repeat(innerWidth)}╯`, phase + 2 * width + lines.length - 1, -1),
    ),
  ];
}

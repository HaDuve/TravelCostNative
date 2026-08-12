export type ChangelogItem = {
  versionString: string;
  changes: string[];
};

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const BULLET_LINE_RE = /^\s*-\s+/;
const CONTINUATION_LINE_RE = /^\s{2,}\S/;

function formatBulletLine(text: string): string {
  return `\n\n• ${capitalizeFirstLetter(text)}`;
}

/** Turn raw `-` bullets and indented continuations into rendered changelog lines. */
export function parseChangelogBulletLines(lines: string[]): string[] {
  const bullets: string[] = [];

  for (const line of lines) {
    if (BULLET_LINE_RE.test(line)) {
      bullets.push(formatBulletLine(line.replace(BULLET_LINE_RE, "")));
      continue;
    }

    if (CONTINUATION_LINE_RE.test(line) && bullets.length > 0) {
      bullets[bullets.length - 1] += `\n  ${line.trim()}`;
      continue;
    }

    if (line.trim()) {
      bullets.push(formatBulletLine(line.trim()));
    }
  }

  return bullets;
}

export function parseChangelog(changelogString: string): ChangelogItem[] {
  const changelogItems: ChangelogItem[] = [];

  const versions = changelogString.split(/\n\n/g);

  versions.forEach((version) => {
    const lines = version.split("\n");
    if (lines.length > 1) {
      const versionInfo = lines[0];
      const changes = parseChangelogBulletLines(lines.slice(1));

      const versionStringMatch = versionInfo.match(
        /(\d+\.\d+\.\d+[a-zA-Z]*\d*)/
      );

      if (versionStringMatch) {
        const versionString = versionStringMatch[1];
        changelogItems.push({ versionString, changes });
      }
    }
  });

  return changelogItems;
}

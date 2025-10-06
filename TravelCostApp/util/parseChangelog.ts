export type ChangelogItem = {
  versionString: string;
  changes: string[];
};

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function parseChangelog(changelogString: string): ChangelogItem[] {
  const changelogItems: ChangelogItem[] = [];

  const versions = changelogString.split(/\n\n/g);

  versions.forEach(version => {
    const lines = version.split("\n");
    if (lines.length > 1) {
      const versionInfo = lines[0];
      let changes = lines.slice(1);

      // Replace "-" with "•" and add a new line before each occurrence
      changes = changes.map(
        change =>
          `\n\n• ${capitalizeFirstLetter(change.replace(/^\s*-\s*/, ""))}`
      );

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

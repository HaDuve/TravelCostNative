export type ChangelogItem = {
  versionString: string;
  changes: string[];
};

export function parseChangelog(changelogString: string): ChangelogItem[] {
  const changelogItems: ChangelogItem[] = [];

  const versions = changelogString.split(/\n\n/g);

  versions.forEach((version) => {
    const lines = version.split("\n");
    if (lines.length > 1) {
      const versionInfo = lines[0];
      const changes = lines.slice(1);

      // Adjust versionInfo to capture all characters until the first space
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

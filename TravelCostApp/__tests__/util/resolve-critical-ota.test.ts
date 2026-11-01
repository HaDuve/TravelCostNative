import { resolveIsCriticalOta } from "../../util/resolve-critical-ota";

describe("resolveIsCriticalOta", () => {
  it("uses a trailing ! on the EAS message version segment when present", () => {
    expect(
      resolveIsCriticalOta({
        easMessage: "1.3.005n!: Fix excessive data usage",
        changelogSource: null,
      })
    ).toBe(true);
    expect(
      resolveIsCriticalOta({
        easMessage: "1.3.005n: Fix excessive data usage",
        changelogSource: null,
      })
    ).toBe(false);
  });

  it("falls back to the newest changelog version line when the EAS message is missing", () => {
    const criticalChangelog = `Changelog

__Newest Changes:

1.3.005n!
- Fix excessive data usage

__Other Changes:

1.3.005m
- Older note
`;
    const normalChangelog = `Changelog

__Newest Changes:

1.3.005n
- Ordinary fix

__Other Changes:
`;

    expect(
      resolveIsCriticalOta({
        easMessage: null,
        changelogSource: criticalChangelog,
      })
    ).toBe(true);
    expect(
      resolveIsCriticalOta({
        easMessage: undefined,
        changelogSource: normalChangelog,
      })
    ).toBe(false);
  });

  it("prefers the remote changelog mark when the EAS message is absent from the client", () => {
    expect(
      resolveIsCriticalOta({
        easMessage: "",
        changelogSource: `Changelog

__Newest Changes:

1.3.005n!
- Fix excessive data usage

__Other Changes:
`,
      })
    ).toBe(true);
  });

  it("is not critical when neither signal marks critical", () => {
    expect(
      resolveIsCriticalOta({
        easMessage: null,
        changelogSource: null,
      })
    ).toBe(false);
  });
});

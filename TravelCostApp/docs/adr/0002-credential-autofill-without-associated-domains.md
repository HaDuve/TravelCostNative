# Credential autofill ships without associated domains / Digital Asset Links

Sign-in and sign-up fields carry OS autofill hints (`username`, `password`, `newPassword`) so the password manager can fill and save credentials. iOS `webcredentials:` associated domains and Android Digital Asset Links were deliberately skipped: the repo has no web domain for the app (`app.json` / `app.config.js` only reference `u.expo.dev`), so there is nothing to associate.

## Consequences

- Autofill works, but saved credentials are scoped to this app only, not shared with a website.
- Once the app has a web domain, add `webcredentials:<domain>` to iOS associated domains and publish `assetlinks.json` for Android.
- Device verification (iOS and Android save/fill prompts) is manual; see the PR #441 test plan.

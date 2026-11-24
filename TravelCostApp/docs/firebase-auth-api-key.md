# Firebase Auth API key: Token Service console step

The app signs Travellers in and refreshes their ID tokens with the Firebase Web API key defined in `util/firebase-auth.ts`. Two endpoints are used:

- `identitytoolkit.googleapis.com` (password sign-in fallback)
- `securetoken.googleapis.com` (hourly ID token refresh)

## Required console step

In Google Cloud Console, open **APIs & Services > Credentials**, select the browser API key used by the app, and under **API restrictions** make sure both of these APIs are allowed:

- Identity Toolkit API
- **Token Service API** (`securetoken.googleapis.com`)

If the Token Service API is not allowed, the refresh request is rejected with 403 `PERMISSION_DENIED` and `reason: API_KEY_SERVICE_BLOCKED`. Every hourly refresh then falls back to password sign-in, which only works for Travellers with stored credentials.

## How to verify

A refresh request with a dummy refresh token should return **400 `INVALID_REFRESH_TOKEN`**, not 403:

```bash
curl -s -X POST "https://securetoken.googleapis.com/v1/token?key=<API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"grant_type":"refresh_token","refresh_token":"dummy-refresh-token"}'
```

A 403 response means the console step above is still missing.

## Related code

- `util/firebase-auth.ts`: `getValidIdToken` shares one in-flight refresh or password sign-in between concurrent callers.
- `__tests__/util/firebase-auth-token.test.ts`: covers valid, expired-with-refresh, refresh-failure fallback, and both-failing cases against a fake auth endpoint.

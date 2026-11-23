# Security

The editor listens only on `127.0.0.1`, rejects requests with a foreign `Host` header and accepts only JSON `POST` requests, so a web page you visit cannot drive it.
Its only network request is the optional once-a-day check for a new release on api.github.com (no personal data; it can be turned off in the About dialog).

If you find a security problem, please open a private security advisory on GitHub instead of a public issue.

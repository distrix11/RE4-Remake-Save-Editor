# Security

The editor listens only on `127.0.0.1`, rejects requests with a foreign `Host` header and accepts only JSON `POST` requests, so a web page you visit cannot drive it.
It makes no network requests except to open your browser locally.

If you find a security problem, please open a private security advisory on GitHub instead of a public issue.

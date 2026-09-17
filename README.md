# Editor Controller

The editor's review app. Static HTML/CSS/JS, no build step — talks to the
Backend Server to see, edit, publish, unpublish, and return every post on
the server.

## Running it locally

Needs the Backend Server running (see `../Backend Server/README.md`) and its
`.env` `ALLOWED_ORIGINS` to include this app's origin.

```bash
python3 -m http.server 8423
```

Then open `http://localhost:8423`. `api.js` points at
`http://localhost:4000/api` by default — change `API_BASE` there if the
backend runs elsewhere.

## How it works

- **Login** only asks for the shared editor password — editors aren't
  individually named the way writers are (see the Backend Server README for
  the reasoning).
- **Dashboard** lists every post on the server, with filter tabs for All /
  Unpublished / Returned / Published. Nothing here is scoped to "your own"
  anything — an editor sees the whole catalog.
- **Detail view** lets you edit any post's byline, title, header image URL,
  and body, and:
  - **Save changes** — persists edits without changing status.
  - **Publish** — makes it publicly visible immediately (saves first).
  - **Unpublish** — pulls a published post back out of public view without
    deleting it.
  - **Return with comment** — sends it back to the author with a note
    explaining what needs to change; it shows up in their Typewriter as
    "Needs revision" with your comment attached.
- Publish/Unpublish/Return are shown or hidden based on the post's current
  status (e.g. a published post only offers Unpublish, since re-publishing or
  returning an already-live post doesn't make sense until it's taken down
  first).

## Known limitation: shared cookie jar during local testing

Both this app and the Typewriter make requests to the same backend origin
(`http://localhost:4000`), and the session cookie is scoped to that origin
regardless of which frontend set it. If you open both apps in tabs of the
*same browser* and log into one as a writer and the other as an editor, only
the most recent login's session actually persists for both — one keeps
overwriting the other's cookie. This isn't a problem in real use (a writer
and an editor are different people, normally on different devices or at
least different browsers), but if you're testing both roles yourself, use
two separate browsers (or one regular + one private/incognito window).

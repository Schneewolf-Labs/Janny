# Janny
Discord bot for reporting sus activity and cleaning up undesirable content

## Running
Create a `.env` with `DISCORD_TOKEN=...`, then:
```
npm install
npm start
```
The bot needs Manage Messages to delete, and Ban Members if `spam.ban` is on. Missing permissions are logged, not fatal.

## Configuration
Everything lives in `config.yaml`:

- `reporting.channel` — where reports are posted. Mentions in reports never ping.
- `reporting.log` — optional path; every report is also appended here as one JSON object per line, so it can be reviewed later (by a person or a scheduled egirl task).
- `profanity` — `bad-words` filter plus extra `words`. Can warn, delete, and skip NSFW channels.
- `spam` — an author sending `threshold` messages within `time` seconds is spam, as is any message containing one of `words`. `delete` removes the whole burst, `ban` bans the author and clears their last `time` seconds of messages.

## Tests
```
npm test
```

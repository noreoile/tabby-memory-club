# 狸花俱樂部 / TABBY

2–8 player online memory game with generated photorealistic tabby cat cards.

## Play
Create a room with a name and avatar, share its six-character code or invitation link, and let the host select a board size. Each turn reveals two cards. A matching pair earns one point and another turn; mismatches and timeouts move to the next online player. Odd boards include one unscored rest tile. Games finish with a leaderboard and support replay.

## Runtime
React + Vinext on Cloudflare Workers. D1 persists room state with optimistic version checks, opaque per-player session tokens, and server-only hidden card identities. Clients poll for updates. Turns last 35 seconds; disconnected seats are skipped after 45 seconds. Rooms expire after 24 hours. Browser storage stores only the room credential and preferred display name.

## Development
Use Node 22.13 or newer and npm. Run `npm run install:ci`, `npm run db:generate`, then `npm run build`. Apply the generated migration locally using Wrangler's D1 execute with the built config and `.wrangler/state`, then run `npm run dev`.

Production migrations are shipped under `dist/.openai/drizzle`. The hosting configuration declares D1 binding `DB`.

## Assets
`public/cats-v2.png` is a 6×6 sprite sheet of 36 generated tabby portraits. Original built-in imagegen output: 1254×1254 pixels (209×209 per portrait). Intended card display size is under 110px on desktop. Card image identities are not included in API responses until revealed or matched.

## Verification
Validated strict turns, matching and scoring, odd/even board construction, full-round completion and replay, concurrent 8-player joins and capacity limits, session protection, hidden card projection, and idempotent actions. WebMCP read/flip tools were exercised in the browser, including invalid-input rejection.

## Room chat
Authenticated room members can send plain-text messages while waiting, playing, or viewing results. Messages include the sender's name/avatar snapshot and server timestamp, are retained across rounds, and share the room's 24-hour expiry. The latest 100 messages are stored inside the versioned room state. The server enforces 300-character messages, per-player rate limits, duplicate suppression, and room membership. The existing polling loop synchronizes chat without exposing messages to other rooms.

## Viewport layout
Joined rooms fill the available viewport with independent board/chat scrolling. Desktop chat stays beside the board; narrow screens reserve a bottom chat area. Room configuration and results open in a dialog. The board fits the current row/column count, with an optional 110px minimum card zoom mode. Clicking a currently revealed card opens a larger image; concealment automatically closes it without pausing the turn. Verified at 1280×720 and 390×844 using a 6×7 board with eight players.

### Card decks
Room creation offers tabby and orange-cat decks (36 identities each). The server validates and stores `deckSet` in room JSON; all participants use the room theme through rounds. Legacy rooms default to tabby. Generated orange sheet is `public/orange-cats-v1.png`, 1254 × 1254, six-by-six tiles.

Added the Abyssinian deck (36 generated portraits). The homepage now defaults to joining, with room code and name above the fold, a separate create flow, optional collapsed avatars, and entry before preview on mobile. Invitation links prefill the join code.

Matching earns one point and another turn, with a fresh 35-second timer after reveal resolution. Mismatches/timeouts pass play; disconnected players are skipped. Abyssinian v2 uses varied coats, poses, and expressions for easier recognition.

Hosts can configure the next round in the same room from the main board surface. `nextSetup` stores the next deck and grid separately, so completed cards and scores retain their original meaning until the next round begins. Configuration is host-only and blocked during play. Players and chat remain across rounds. A visible start button sits above the selectors. Difficulty labels: Abyssinian easy, tabby medium, orange hard, mixed river/sea otters medium. The new otter sheet contains 36 photographs, 18 of each kind. Avatars now offer 36 choices across three cat decks, with larger picker/preview/player portraits; original avatar IDs 0–7 still point to the same images.

Run `node tests/game-turns.mjs` for turn logic. With the local server running, `node tests/room-config.integration.mjs` checks same-room deck changes, permissions, chat preservation, completed-round state and avatar validation.

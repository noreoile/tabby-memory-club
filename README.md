# 狸花俱樂部 / TABBY

2–8 player online memory game with generated photorealistic tabby cat cards.

## Play
Create a room with a name and avatar, share its six-character code or invitation link, and let the host select a board size. Each turn reveals two cards. A matching pair earns one point; every turn moves to the next online player. Odd boards include one unscored rest tile. Games finish with a leaderboard and support replay.

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

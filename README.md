# Thai Dummy

A browser implementation of four-player Thai Dummy for one human and three computer opponents.

## Features

- Four-player seven-card deal
- Stock draw and multi-card discard-pile pickup
- Opening gate: a player must first meld from the discard pile
- A 50-point head card and expiring head-discard penalties
- Sets, same-suit runs, and extensions to table melds
- Three computer opponents
- Thai Dummy point values, going-out bonus, doubling, and penalties
- Multi-hand match scoring
- Responsive tabletop interface and in-game rules

The base meld and scoring rules use [Ben Lynn's Thai Rummy notes](https://benlynn.blogspot.com/2008/05/thai-rummy_16.html);
the four-player opening and head-card rules follow this project's Thai Dummy rule set.

## Development

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```

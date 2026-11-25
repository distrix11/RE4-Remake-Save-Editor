# Third-party notices

The save encryption in `app/lime.js` is a JavaScript port of the algorithm of LimebrellaSharp (below), so its MIT notice applies to that file.
The other projects are not part of the repository: the class templates are downloaded by `build.bat` at build time.

## LimebrellaSharp

The algorithm to decrypt / encrypt / re-sign the Steam save files (the "Lime" container) was ported to JavaScript from
LimebrellaSharp (`app/lime.js`); no code or binary of it is shipped any more.
Source: https://github.com/mi5hmash/LimebrellaSharp

MIT License, Copyright (c) 2026 Michał Gębicki (see the license text below).

## RE_RSZ

The class and field name templates (`rszre4.json`) are used to turn the hashed field names
in the save data into readable names. Source: https://github.com/alphazolam/RE_RSZ

MIT License, Copyright (c) 2021 alphazolam

## Node.js

The all-in-one release archive bundles the unmodified official Node.js Windows build as `runtime/node.exe`
(downloaded from https://nodejs.org and checked against the published SHA-256 list). Its license is included as `runtime/LICENSE-Node.txt`.
The script-only packages do not contain Node.js; they use the one installed on the PC.

## MIT License text (applies to the MIT-licensed projects above)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Data sources

- `app/catalog.txt`: item IDs and names come from the community "Ultimate Item ID List"
  by kTeo (residentevilmodding.boards.net). It is fan-compiled and not verified in full.
- `app/quests.json`, `app/regions.json`: request and treasure information was written from
  public guides (HoldToReset, Prima Games, Push Square). The descriptions are the author's own wording.
  The mapping of save IDs to requests is partly inferred and marked as such in the interface.
- `app/footprints.json`: item sizes are estimated from the layouts found in the author's own saves.

## Trademarks

Resident Evil, Resident Evil 4 and related names are trademarks of Capcom Co., Ltd.
Steam is a trademark of Valve Corporation. This is an unofficial fan tool and is not
affiliated with, endorsed by or supported by Capcom or Valve. No game assets are included.

## Item icons (icons/items)

The pictures in `icons/items` are renders of original procedural 3D models written for this project (`scripts/icon-render/procedural.html` and `builders-extra.js`, MIT like the rest of the project). They contain no third-party or game assets.

# Third-party notices

This project does **not** include the code or data of the projects below in the repository.
`build.bat` downloads them at build time. If you redistribute a build that contains them
(for example a release archive with the compiled encryptor), you must ship these notices with it.

## LimebrellaSharp

Used to decrypt / encrypt / re-sign the Steam save files (the "Lime" container).
Source: https://github.com/mi5hmash/LimebrellaSharp

MIT License, Copyright (c) 2026 Michał Gębicki

The NuGet packages used by LimebrellaSharp (Mi5hmasH.ConsoleHelper, Mi5hmasH.Converters, Mi5hmasH.GameLaunchers,
Mi5hmasH.Logger, Mi5hmasH.Progress) are published by the same author under the MIT license.
Release archives that include the compiled encryptor (`encryptor/*.dll`) contain these libraries; their license is the MIT text below.

## RE_RSZ

The class and field name templates (`rszre4.json`) are used to turn the hashed field names
in the save data into readable names. Source: https://github.com/alphazolam/RE_RSZ

MIT License, Copyright (c) 2021 alphazolam

## MIT License text (applies to both projects above)

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

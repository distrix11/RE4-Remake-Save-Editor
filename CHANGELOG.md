# Changelog

## Unreleased (for 0.9.1)
- Fixed: the update check did not see pre-releases (GitHub never reports a pre-release as "latest"), so it said that no release exists. It now looks at the list of releases and names a pre-release as such.
- Fixed (found in the first Separate Ways test): "Case look" changed the skin of Leon only, so the case of a Separate Ways slot (Ada) did not change; the skin of the character of the slot is read and written now.
- Weapons that are not in the catalogue (Ada's weapons of Separate Ways) were drawn as empty cells; they are shown now as "Weapon / Knife (not in the catalogue, ID ...)" with a generic icon.
- New **Add weapon…** button: takes a real weapon (with its upgrades, ammo and durability) from one of your other slots and puts a copy into this case, with a new id in a free cell. Levels above the maximum are cut and the exclusive upgrade is dropped if another upgrade is not at the maximum, so mistakes of other slots do not spread. Only weapons that exist in your other slots of the same campaign are offered: tested in the game, a copy from the same campaign works, while a Handcannon put into a Separate Ways slot was removed by the game.
- Ada's weapons of Separate Ways have names now (Blast Crossbow, Blacktail AC, Stingray, Tactical Knife; names confirmed in the game) and use the picture of the matching weapon.
- New banner when the file of the open slot was changed outside the editor after it was opened (the game saved it, Steam Cloud, another tool): "Reload from disk" or "Keep my copy". "Save to game" also asks before it would overwrite such a change.
- Wording: closing the game before writing is advised, not required (banner, README, release notes); writing from the main menu and loading the slot works too.
- The update banner has GitHub and Nexus Mods buttons (and the About dialog a link to the Nexus Mods page).
- Issue templates are forms now (package, version, did the game load the save, diagnostics, a required "no save files attached" box).

## 0.9.0 (pre-release)
- No more .NET and no separate encryptor: the save encryption is built in (`app/lime.js`, a JavaScript port of LimebrellaSharp checked byte for byte against the original on real saves in both directions). Opening a slot takes about 0.1 s instead of seconds.
- New `start.js` (double-click, no console window) starts the editor in its own app-style window, using `runtime/node.exe` or the Node.js 20+ installed on the PC (if there is none, it offers to open the Node.js download page; the script downloads nothing itself). The Nexus archive contains no `.exe`, `.dll` or `.bat` any more. The all-in-one archive is half the size (about 37 MB).
- Fixed: the backup list and the "Restore from backup" window failed with "fmtSize is not defined" and showed nothing.
- Fixed: the "Reset upgrades" button was drawn on top of "Full upgrade" (a leftover style of the removed Map view).
- New "Case look" selector next to the case size: choose Silver, Black, Leather, Gold or Classic. A skin you do not own yet is unlocked too (added to the recipes, cases and charms inventory).
- The Advanced tab asks for a one-time confirmation (a checkbox) that it is for experienced users and can damage the save. The choice is remembered in config.json.
- Weapon upgrades reworked after checking how the game stores them: all effect fields of an upgrade are written together (the Handcannon and SR M1903 reload through a different field than other guns, which used to be left at the old value). The exclusive upgrade is its own 0/1 setting and is taken away when a normal upgrade is lowered (the game needs all of them at 4 for it).
- New "Full upgrade" button next to weapons (list and Case view) and "Reset upgrades" in the upgrade panel.
- New "Sort" button in the Case view: packs the items to the left, grouped (weapons, throwables, healing, ammo, accessories, the rest), big items first. Rotations are kept, nothing changes if an item would not fit; "Discard edits" undoes it.
- Fixed (found in the first in-game test): weapon upgrade levels go up to 4 (the highest seen in real saves); the game reset higher values such as 7 to the first level.
- Fixed (found in the first in-game test): herbs, sprays and accessories are added as separate entries instead of stacking into one (they do not stack in the game). Ammo stacks only up to the per-slot limit seen in real saves (handgun 50, rifle 15, ...) and the rest goes into new entries.
- Weapon sizes corrected: guns are two rows tall and 2-6 columns wide, the SR M1903 is one row; checked so that no items overlap in real saves.
- Fixed saves that failed to open ("unknown class" error): the size of the physics data blocks is now found by the shape of their elements instead of guessing the next token.
- Settings window: choose the save folder or Steam account from inside the editor.
- Safer writes: the new file is written to a temporary name, decrypted back and compared, then moved into place.
- Backup manager, plus an automatic first-run copy of every slot that is never deleted by the editor.
- Format guard: if a game update changes the save layout, structural edits are disabled and a banner explains it.
- Copy diagnostics (no personal data) for bug reports.
- Pale-green colour scheme closer to the original game.
- The flat Map view is gone: the Case view now does everything it did (drag to move, Rotate button), with hover and selection effects.
- Static case view with 3D-rendered item icons (about 150 original icons for every catalogue item, generated by `scripts/icon-render`); the case takes the look of the skin chosen in the save.
- The launcher exe and the editor window now use the 3D herb as their icon (`launcher/icon.ico`, built by `scripts/make-icon.js`).
- Daily update check (switch in the new About dialog, opened with the ? button). It never downloads anything.
- The launcher opens the editor in its own app-style window and stops the server when the window is closed.
- Small launcher `RE4SaveEditor.exe` and an all-in-one Windows archive with bundled Node.js and encryptor.

## 0.1.0
- First version: money, inventory (add, remove, copy, move on a case map), case size, weapon upgrades, merchant requests, treasures, achievements, restore from backup.

# Changelog

## Unreleased (for 0.9.5)
- New pictures for the treasures (jewellery, statues, clocks, gold and the rest) and the red herb (a tied bunch of pink flowers), closer to how they look in the game.
- Fixed the case sizes of the High-Power Scope (3 cells), Red9 Stock (4) and Matilda Stock (3): they were taken as one cell, so such an item could be added on top of another.
- New pictures for the accessories: the three scopes, the laser sight and the Red9, Matilda and TMP stocks.
- Case view: the picture of an item turns with the item (R or Rotate), as in the game, and fills its cells better.
- New pictures for the Black Bass, the viper and the Ornate Beetle.
- Mixed herbs are drawn as corked vials with a layer of powder per herb, as in the game.
- New pictures for the single herbs (bunches of feathery leaves), the first aid spray, the three grenades (one shape, green, blue and red), the mines, the bolts and the explosive arrows. The leaf stays the logo of the editor.
- New pictures for the ammunition boxes (a colour for every kind), the gunpowder tin and the two bags of resources, closer to how they look in the game.
- The Inventory lists show the picture of every item and weapon instead of the category sign.
- **Undo** (button and Ctrl+Z): takes back the last changes one by one, up to 30.
- Keys in the Case view for the selected item: R rotate, Delete remove, arrows move, Esc deselect.
- **Add weapon…** shows the picture of every weapon and whether it fits the case now (fits, fits turned, no room, with the size).
- The leaf in the header sways under the mouse and shakes when clicked.

## 0.9.4 (pre-release)
- The file that starts the editor is now called **Start RE4 Save Editor.js** (it was `start.js`).
- Settings > **Create desktop shortcut**: a "RE4 Save Editor" shortcut with the herb icon on the desktop.
- Every weapon has its own picture now, an original model with the recognisable shape of the weapon, drawn to the cells it takes in the case (before: pictures from a general CC0 gun pack, many of them unlike the weapon).
- The Leather case is red, as in the game (Case view and icon).
- Interface motion: a short start screen; the attaché case opens, items slide to their new cells (move, rotate, Sort), a new item or weapon is laid in and glows, removed ones fade; soft transitions between tabs, dialogs, banners and messages; "Save to game" pulses while there are unsaved edits and confirms the write; money counts up; a loading placeholder.
- Settings > Animations: "As in Windows" (default; off when animation effects are off in Windows), "On" or "Off".

## 0.9.3 (pre-release)
- The GitHub archive has no launcher `.exe` of its own any more: double-click `start.js` (Node.js is still inside). Windows Defender flagged the unsigned launcher of 0.9.1 (`Trojan:Win32/Wacatac.B!ml`, a machine-learning verdict) and a few other scanners did too. The editor itself is unchanged.

## 0.9.2 (pre-release)
- The exclusive upgrade switch now also sets the two other values that real saves have together with that upgrade (and clears them when it is switched off). Tested in the game.
- Fixed: opening the editor again after closing it could show a window that cannot connect to the editor (Edge handed the window to a process that was still running, and the server was stopped too early or left over). The server now notices itself that its last window is closed and stops after a few seconds; the launchers no longer decide that.
- **Add weapon…** now also offers **new weapons** from a built-in library (no upgrades, empty magazine; 15 weapons of the main game and 7 of Separate Ways). Adding a weapon also sets its "obtained" flag in the save. The library is made from real entries by `scripts/build-weapon-library.js` and has no personal data. Weapons of the other campaign are refused. Tested in the game as new weapons: SG-09 R, Punisher, Red9, Blacktail, Sentinel Nine, Riot Gun, Semi Auto Rifle Stingray, LE 5, Fighting Knife; Separate Ways: Sawed-off W-870, SR M1903, Red9. The others are not tested. Bonus and DLC weapons (Chicago Sweeper, Handcannon, Sentinel Nine) carry a warning: the game deletes a weapon you have not unlocked (seen with the Chicago Sweeper). Left out because the game did not accept them: two Separate Ways weapons. A second copy of a weapon already in the case may be removed by the game. Not in the library: W-870 (main game), Striker, TMP, CQBR, Broken Butterfly, Bolt Thrower, the rocket launchers, Kitchen/Boot/Primal Knife, Skull Shaker, Krauser's Bow.
- Fixed: the sizes of long weapons in the case were underestimated (for example the Riot Gun is 2x8, not 2x5, the SR M1903 1x9, not 1x6, and the LE 5 2x6), so an added or moved item could stick out of the case or cover another one; the game deletes such a weapon. The sizes are now taken from the free space around them in many real layouts. A new weapon is turned when only that fits.
- Fixed: slots whose inventories are stored in another order (the treasures first) showed the treasures instead of the case. The inventories are put in a fixed order now.
- Fixed: the parser stopped at an empty object of a class it does not know (found in saves of other players); such objects are accepted now.
- The hint of the "Sprinter" achievement no longer shows a green "ok" when the time so far is under 8 h but the pace of the slot would take longer: it is a neutral note and says that the estimate is rough.

## 0.9.1 (pre-release)
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

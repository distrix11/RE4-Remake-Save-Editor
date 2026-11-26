# RE4 Save Editor v1.0.0

An unofficial, local save editor for **Resident Evil 4 (2023 remake), Steam, Windows**. It runs on your own computer and never sends your saves anywhere.

> [!WARNING]
> **Use at your own risk.** Editing saves can corrupt them. The editor makes a backup before every write and keeps a protected first-run copy of every slot, but keep your own copies too. It is best to close the game before saving, and consider turning off Steam Cloud for RE4.

## What is new in 1.0

The first stable release. Every feature of the pre-releases was checked in the game, from start to end: money, adding, moving, sorting and deleting items, the case size and look, new and copied weapons, upgrades and the exclusive upgrade, the storage, gems, merchant requests, copying a slot, restoring a backup, undo and the desktop shortcut (the checklist is in `docs/TESTING.md`).

- **Merchant requests**: all 26 names (19 of the main game, 7 of Separate Ways) are confirmed by their goals and by the order in which test slots completed them; the "probably" marks are gone.
- **Item sizes** checked in the game: Yellow Herb, Lunker Bass, Bolts, Attachable Mine, Rhinoceros Beetle and the eggs. **Blast Arrows** (the arrows of the Blast Crossbow) can be added in Separate Ways; "Explosive Arrows", which the game does not take, are hidden.
- **Weapon upgrades**: every fully upgraded weapon of the tested saves has 4 in each of its upgrades, so the 0-4 range holds for all weapons.
- **New pictures** for the rocket launchers, the Killer7 and the Chicago Sweeper, closer to the game.
- The **What's new** window of a stable release celebrates it.

## What was new in 0.9.9

- Twelve more weapons, editing and adding right in the Case view, deleting equipped weapons, weapons that go into the storage with their attachments.

## What you can do

- **Money**: Pesetas and Spinel.
- **Attaché case**: add, copy and delete items from a catalogue of ~220, change counts, ammo and durability, change the **case size** and the **case look** (Silver, Black, Leather, Gold, Classic).
- **Case view**: your case lying down like in the game, with original 3D-rendered icons for every item and weapon. Drag items to move them, rotate them, or press **Sort** to tidy the case; click or right-click an item to edit it, right-click an empty place to add something there.
- **Weapons**: add a new one or copy one from another slot; upgrade levels 0-4, **Full upgrade**, **Upgrade all weapons** and a switch for the exclusive upgrade.
- **Merchant requests**, **treasures**, **achievements** (read-only hints) and an **Advanced** raw field view (asks for a one-time confirmation).
- **Safety**: a "game is running" warning, a summary of every change before writing, writes that are decrypted back and compared before they replace the file, a backup manager and restore, copying one slot into another.

## Download

**`RE4SaveEditor-1.0.0-windows-allinone.zip`** (38.7 MB): extract it anywhere and double-click `Start RE4 Save Editor.js`. Nothing to install: Node.js is inside and the save encryption is built in. If Windows asks whether to run the script, choose Open / Run; if `Start RE4 Save Editor.js` opens in a text editor, use "Open with > Microsoft Windows Based Script Host".

SHA-256:

```text
466a217b0a6279ea2feed2dcdf4bed9f836a7ae81b896ac80781d44711d7df3d  RE4SaveEditor-1.0.0-windows-allinone.zip
```

A smaller script-only package (needs [Node.js](https://nodejs.org) 20+ installed) is published on Nexus Mods. To build from source: `git clone`, run `build.bat` once, then `start.bat`.

**VirusTotal:** [1 engine](https://www.virustotal.com/gui/file/466a217b0a6279ea2feed2dcdf4bed9f836a7ae81b896ac80781d44711d7df3d) flags this archive (a generic heuristic for scripts, as in earlier versions; a false positive in our opinion); the other engines report it clean. The number can change when the file is re-scanned: the link shows the current result.

## Quick start

1. Close the game: if the game has saved a slot since it was started, it refuses that slot after an edit ("incompatible save data") until it is restarted.
2. Start the editor, pick a slot on the start screen, edit, press **Save to game**. A summary of the changes is shown first.
3. **More > Restore from backup...** undoes a write at any time.

The save folder (`<Steam>/userdata/<account>/2050650/remote/win64_save`) is found automatically; use the gear button if you have several Steam accounts.

## Known limitations

- Item sizes in the case are taken from real layouts and checked in the game; a few rare items (for example the large Black Bass) are not checked yet.
- Weapon upgrade levels go from 0 to 4 (every fully upgraded weapon of the tested saves has 4 in each upgrade).
- A few weapons cannot be added as new: the Minecart Red9, Krauser's Bow and the Kitchen Knife of Separate Ways.
- Checked in the game on one game version; a game patch may change the save format (the editor then disables structural edits and says so).
- Windows and the Steam version only.

## Feedback

Please open an issue and describe what happened (the editor's **Copy diagnostics** button gives a report without personal data). Please **do not attach your save files** to an issue: a save is tied to your Steam account number (not your password or e-mail), which would become public.

Full list of changes: [CHANGELOG.md](https://github.com/distrix11/RE4-Remake-Save-Editor/blob/main/CHANGELOG.md).

# RE4 Save Editor v0.9.9 (pre-release)

An unofficial, local save editor for **Resident Evil 4 (2023 remake), Steam, Windows**. It runs on your own computer and never sends your saves anywhere.

> [!WARNING]
> **Pre-release. Use at your own risk.** Editing saves can corrupt them. The editor makes a backup before every write and keeps a protected first-run copy of every slot, but keep your own copies too. It is best to close the game before saving, and consider turning off Steam Cloud for RE4.

## What is new in 0.9.9

- **Twelve more weapons** in **Add weapon…**, taken from saves where the game itself added them, with their sizes checked in the game: Broken Butterfly, Skull Shaker, Rocket Launcher (Special), Rocket Launcher (Infinite), Primal Knife, Kitchen Knife, Boot Knife (also in Separate Ways), and for Separate Ways Punisher MC, TMP, Chicago Sweeper, Rocket Launcher and the **Elite Knife**. The game keeps the Elite Knife only in the storage, so the editor puts it there.
- **Case view**: a click on an item shows everything the list has (count, ammo, durability, upgrade levels, gem sockets, **To storage**); a **right click** opens a menu (Rotate, Full upgrade, Upgrades, To storage, Copy, Delete); a right click on an empty place offers **Add item here…** and **Add weapon here…**, and the new item goes onto that place.
- **Equipped weapons** can be deleted or put into the storage: their equip slot and quick slots are emptied.
- **Storage**: weapons go there and back **with the attachments fitted to them**, as the game does; scopes, stocks and the laser sight can be moved on their own. Other things stay out of the storage, as in the game.
- The page keeps its place after Delete, Copy or another change; a new revolver picture for the Broken Butterfly; the Kitchen Knife takes 1×2 cells, as in the game.

## What was new in 0.9.8

- The storage, gems in treasures, six more weapons, eggs, and "incompatible save data" explained.

## What you can do

- **Money**: Pesetas and Spinel.
- **Attaché case**: add, copy and delete items from a catalogue of ~220, change counts, ammo and durability, change the **case size** and the **case look** (Silver, Black, Leather, Gold, Classic).
- **Case view**: your case lying down like in the game, with original 3D-rendered icons for every item and weapon. Drag items to move them, rotate them, or press **Sort** to tidy the case; click or right-click an item to edit it, right-click an empty place to add something there.
- **Weapons**: add a new one or copy one from another slot; upgrade levels 0-4, **Full upgrade**, **Upgrade all weapons** and a switch for the exclusive upgrade.
- **Merchant requests**, **treasures**, **achievements** (read-only hints) and an **Advanced** raw field view (asks for a one-time confirmation).
- **Safety**: a "game is running" warning, a summary of every change before writing, writes that are decrypted back and compared before they replace the file, a backup manager and restore, copying one slot into another.

## Download

**`RE4SaveEditor-0.9.9-windows-allinone.zip`** (38.7 MB): extract it anywhere and double-click `Start RE4 Save Editor.js`. Nothing to install: Node.js is inside and the save encryption is built in. If Windows asks whether to run the script, choose Open / Run; if `Start RE4 Save Editor.js` opens in a text editor, use "Open with > Microsoft Windows Based Script Host".

SHA-256:

```text
4a668b95752ba71e39d4419c3b3931842d632d76aaf830302e80045f5aeef714  RE4SaveEditor-0.9.9-windows-allinone.zip
```

A smaller script-only package (needs [Node.js](https://nodejs.org) 20+ installed) is published on Nexus Mods. To build from source: `git clone`, run `build.bat` once, then `start.bat`.

**VirusTotal:** [1 engine](https://www.virustotal.com/gui/file/4a668b95752ba71e39d4419c3b3931842d632d76aaf830302e80045f5aeef714) flags this archive (a generic heuristic for scripts, as in earlier versions; a false positive in our opinion); the other engines report it clean. The number can change when the file is re-scanned: the link shows the current result.

## Quick start

1. Close the game: if the game has saved a slot since it was started, it refuses that slot after an edit ("incompatible save data") until it is restarted.
2. Start the editor, pick a slot on the start screen, edit, press **Save to game**. A summary of the changes is shown first.
3. **More > Restore from backup...** undoes a write at any time.

The save folder (`<Steam>/userdata/<account>/2050650/remote/win64_save`) is found automatically; use the gear button if you have several Steam accounts.

## Known limitations

- Item sizes in the case are taken from real layouts; a few items may still look different in the game.
- Weapon upgrade levels are limited to 0-4 (the highest seen in real saves). Some weapons have fewer upgrades; the editor does not know which.
- A few weapons cannot be added as new: the Minecart Red9, Krauser's Bow and the Kitchen Knife of Separate Ways.
- Names of merchant requests are not stored in the save; the mapping is partly inferred.
- Tested on a limited set of saves and one game version; a game patch may change the save format (the editor then disables structural edits and says so).
- Windows and the Steam version only.

## Feedback

Please open an issue and describe what happened (the editor's **Copy diagnostics** button gives a report without personal data). Please **do not attach your save files** to an issue: a save is tied to your Steam account number (not your password or e-mail), which would become public.

Full list of changes: [CHANGELOG.md](https://github.com/distrix11/RE4-Remake-Save-Editor/blob/main/CHANGELOG.md).

# RE4 Save Editor v0.9.7 (pre-release)

An unofficial, local save editor for **Resident Evil 4 (2023 remake), Steam, Windows**. It runs on your own computer and never sends your saves anywhere.

> [!WARNING]
> **Pre-release. Use at your own risk.** Editing saves can corrupt them. The editor makes a backup before every write and keeps a protected first-run copy of every slot, but keep your own copies too. It is best to close the game before saving, and consider turning off Steam Cloud for RE4.

## What is new in 0.9.7

**Please update if you use 0.9.6 or older:** a few items were taken as smaller than they are, so a new item could be put on top of them and the game deleted it.

- **Item sizes checked in the game:** Magnum Ammo, Submachine Gun Ammo and Resources (L) take 2 cells, the TMP Stock 3×2, the mixed herb vials 1×2.
- **Overlap warning:** items that overlap another one or stick out of the case are shown in red, a banner names them with a **Sort the case** button, and the summary before writing warns that the game would delete them.
- **Start screen:** every slot card shows a small picture of the slot's own case, with its look and the items in their places.
- **Refresh** button (two arrows) next to the slot list: reads the save files again, for example after the game saved.
- **Merchant requests:** **Complete** is checked in the game (the reward is given). Blue medallion requests are left to the game: it counts the medallions you really destroy and ignores a mark.

## What was new in 0.9.6

- Start screen, grenades, Upgrade all weapons / Repair knives / Fill ammo stacks, named Separate Ways requests, money limits, a question before unsaved edits are dropped, key items protected, own question windows, Ctrl+S, upgrade steps, a More menu, new key item pictures.

## What you can do

- **Money**: Pesetas and Spinel.
- **Attaché case**: add, copy and delete items from a catalogue of ~220, change counts, ammo and durability, change the **case size** and the **case look** (Silver, Black, Leather, Gold, Classic).
- **Case view**: your case lying down like in the game, with original 3D-rendered icons for every item and weapon. Drag items to move them, rotate them, or press **Sort** to tidy the case.
- **Weapons**: add a new one or copy one from another slot; upgrade levels 0-4, **Full upgrade**, **Upgrade all weapons** and a switch for the exclusive upgrade.
- **Merchant requests**, **treasures**, **achievements** (read-only hints) and an **Advanced** raw field view (asks for a one-time confirmation).
- **Safety**: a "game is running" warning, a summary of every change before writing, writes that are decrypted back and compared before they replace the file, a backup manager and restore, copying one slot into another.

## Download

**`RE4SaveEditor-0.9.7-windows-allinone.zip`** (38.7 MB): extract it anywhere and double-click `Start RE4 Save Editor.js`. Nothing to install: Node.js is inside and the save encryption is built in. If Windows asks whether to run the script, choose Open / Run; if `Start RE4 Save Editor.js` opens in a text editor, use "Open with > Microsoft Windows Based Script Host".

SHA-256:

```text
f91ffd028fe4d0a9075299dca9303b5c61a5dd8e0f99a4b4e483fdae4acf3140  RE4SaveEditor-0.9.7-windows-allinone.zip
```

A smaller script-only package (needs [Node.js](https://nodejs.org) 20+ installed) is published on Nexus Mods. To build from source: `git clone`, run `build.bat` once, then `start.bat`.

**VirusTotal:** [report for this file](https://www.virustotal.com/gui/file/f91ffd028fe4d0a9075299dca9303b5c61a5dd8e0f99a4b4e483fdae4acf3140).

## Quick start

1. Preferably close the game (writing from the main menu and then loading the slot also works).
2. Start the editor, pick a slot on the start screen, edit, press **Save to game**. A summary of the changes is shown first.
3. **More > Restore from backup...** undoes a write at any time.

The save folder (`<Steam>/userdata/<account>/2050650/remote/win64_save`) is found automatically; use the gear button if you have several Steam accounts.

## Known limitations

- Item sizes in the case are taken from real layouts; a few items may still look different in the game.
- Weapon upgrade levels are limited to 0-4 (the highest seen in real saves). Some weapons have fewer upgrades; the editor does not know which.
- Not every weapon can be added as new: the main-game W-870, Striker, TMP, CQBR, Broken Butterfly, Bolt Thrower, the rocket launchers and some knives are not in the list. Eggs cannot be added.
- Names of merchant requests are not stored in the save; the mapping is partly inferred.
- Tested on a limited set of saves and one game version; a game patch may change the save format (the editor then disables structural edits and says so).
- Windows and the Steam version only.

## Feedback

Please open an issue and describe what happened (the editor's **Copy diagnostics** button gives a report without personal data). Please **do not attach your save files** to an issue: a save is tied to your Steam account number (not your password or e-mail), which would become public.

Full list of changes: [CHANGELOG.md](https://github.com/distrix11/RE4-Remake-Save-Editor/blob/main/CHANGELOG.md).

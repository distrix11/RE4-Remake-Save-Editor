# RE4 Save Editor v0.9.6 (pre-release)

An unofficial, local save editor for **Resident Evil 4 (2023 remake), Steam, Windows**. It runs on your own computer and never sends your saves anywhere.

> [!WARNING]
> **Pre-release. Use at your own risk.** Editing saves can corrupt them. The editor makes a backup before every write and keeps a protected first-run copy of every slot, but keep your own copies too. It is best to close the game before saving, and consider turning off Steam Cloud for RE4.

## What is new in 0.9.6

The first start of this version shows a short **What's new** window (once; it can be opened again from the **?** dialog).

- **Start screen** with a card for every save slot: the look of the case, chapter, play time, money. A click opens the slot.
- **Grenades** (hand, heavy, flash) can be added with **Add item**. The Heavy and Flash Grenade take two cells, as in the game.
- **Quick buttons** above the case: **Upgrade all weapons**, **Repair knives** (full durability by the knife's upgrade level), **Fill ammo stacks**.
- **Separate Ways**: the seven merchant requests have names, descriptions and rewards.
- **Safer editing**
  - Money: a negative amount was written as about 4.3 billion. Pesetas now take 0 to 99,999,999 and Spinel 0 to 999; counts, ammo and durability are checked too.
  - Choosing another slot with unsaved edits asks first (before, the edits were dropped silently).
  - Deleting a key item warns that the story may need it; key items, recipes, case skins and charms cannot be copied.
  - **Save to game** and **Discard edits** are available only when there are edits.
- **Easier to use**
  - Questions in the editor's own window with clear buttons; **Ctrl+S** for Save to game.
  - Weapon upgrades are set with steps, like the bars at the Merchant.
  - A tidier header: Discard edits, Restore from backup, Copy slot and Export are in the **More** menu.
  - The Inventory list shows only the numbers that mean something; **Add item** shows pictures; the other inventories the save keeps are named and hidden.
  - Names for most of the items that were shown as numbers; the case fits narrow windows.
- **New pictures** for the key items.

## What was new in 0.9.5

- Undo, keys in the Case view, pictures and a space check in **Add weapon…**, pictures in the Inventory lists, many icons redrawn, fixed sizes of three accessories.

## What you can do

- **Money**: Pesetas and Spinel.
- **Attaché case**: add, copy and delete items from a catalogue of ~220, change counts, ammo and durability, change the **case size** and the **case look** (Silver, Black, Leather, Gold, Classic).
- **Case view**: your case lying down like in the game, with original 3D-rendered icons for every item and weapon. Drag items to move them, rotate them, or press **Sort** to tidy the case.
- **Weapons**: add a new one or copy one from another slot; upgrade levels 0-4, **Full upgrade**, **Upgrade all weapons** and a switch for the exclusive upgrade.
- **Merchant requests**, **treasures**, **achievements** (read-only hints) and an **Advanced** raw field view (asks for a one-time confirmation).
- **Safety**: a "game is running" warning, a summary of every change before writing, writes that are decrypted back and compared before they replace the file, a backup manager and restore, copying one slot into another.

## Download

**`RE4SaveEditor-0.9.6-windows-allinone.zip`** (38.7 MB): extract it anywhere and double-click `Start RE4 Save Editor.js`. Nothing to install: Node.js is inside and the save encryption is built in. If Windows asks whether to run the script, choose Open / Run; if `Start RE4 Save Editor.js` opens in a text editor, use "Open with > Microsoft Windows Based Script Host".

SHA-256:

```text
dbc384f43aea557c8dccaec7727a22e2acbe85f2f0383592eed841ebb4fbe185  RE4SaveEditor-0.9.6-windows-allinone.zip
```

A smaller script-only package (needs [Node.js](https://nodejs.org) 20+ installed) is published on Nexus Mods. To build from source: `git clone`, run `build.bat` once, then `start.bat`.

**VirusTotal:** [report for this file](https://www.virustotal.com/gui/file/dbc384f43aea557c8dccaec7727a22e2acbe85f2f0383592eed841ebb4fbe185).

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

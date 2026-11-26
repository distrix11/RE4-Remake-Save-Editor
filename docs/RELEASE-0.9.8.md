# RE4 Save Editor v0.9.8 (pre-release)

An unofficial, local save editor for **Resident Evil 4 (2023 remake), Steam, Windows**. It runs on your own computer and never sends your saves anywhere.

> [!WARNING]
> **Pre-release. Use at your own risk.** Editing saves can corrupt them. The editor makes a backup before every write and keeps a protected first-run copy of every slot, but keep your own copies too. It is best to close the game before saving, and consider turning off Steam Cloud for RE4.

## What is new in 0.9.8

- **Storage.** The storage of the Merchant is shown in the Inventory tab. Weapons move between it and the case with their upgrades (their quick slots are emptied, as the game does; an equipped weapon must be changed in the game first), they can be upgraded there, and **Add weapon…** offers to put a new weapon straight into the storage when the case is full.
- **Gems in treasures.** The sockets of the Elegant Crown, Golden Lynx, Elegant Mask, Butterfly Lamp and the other treasures are shown (round or square), and a gem of the right shape can be set in each.
- **Six more weapons** in **Add weapon…**: W-870, Striker, TMP, CQBR Assault Rifle, Bolt Thrower and the Rocket Launcher, taken from a save where the game itself added them; their sizes were checked in the game.
- **Eggs** (white, brown, golden) can be added with **Add item**.
- **Fixed:** a treasure with sockets added from the catalogue took the sockets of another treasure of the save; added items are now marked as obtained, as the game does.
- **"Incompatible save data"**: if the game has saved a slot since it was started, it refuses that slot after an outside change until you restart the game. The slot itself is fine. The editor's warnings say so now: close the game before writing.

## What was new in 0.9.7

- Item sizes checked in the game, a warning for items that overlap, a mini case on every slot card, a refresh button.

## What you can do

- **Money**: Pesetas and Spinel.
- **Attaché case**: add, copy and delete items from a catalogue of ~220, change counts, ammo and durability, change the **case size** and the **case look** (Silver, Black, Leather, Gold, Classic).
- **Case view**: your case lying down like in the game, with original 3D-rendered icons for every item and weapon. Drag items to move them, rotate them, or press **Sort** to tidy the case.
- **Weapons**: add a new one or copy one from another slot; upgrade levels 0-4, **Full upgrade**, **Upgrade all weapons** and a switch for the exclusive upgrade.
- **Merchant requests**, **treasures**, **achievements** (read-only hints) and an **Advanced** raw field view (asks for a one-time confirmation).
- **Safety**: a "game is running" warning, a summary of every change before writing, writes that are decrypted back and compared before they replace the file, a backup manager and restore, copying one slot into another.

## Download

**`RE4SaveEditor-0.9.8-windows-allinone.zip`** (38.7 MB): extract it anywhere and double-click `Start RE4 Save Editor.js`. Nothing to install: Node.js is inside and the save encryption is built in. If Windows asks whether to run the script, choose Open / Run; if `Start RE4 Save Editor.js` opens in a text editor, use "Open with > Microsoft Windows Based Script Host".

SHA-256:

```text
a424e6143cd571242bbd3ad8b4297ebf130118b5fc43077e020d2dfb1806aae1  RE4SaveEditor-0.9.8-windows-allinone.zip
```

A smaller script-only package (needs [Node.js](https://nodejs.org) 20+ installed) is published on Nexus Mods. To build from source: `git clone`, run `build.bat` once, then `start.bat`.

**VirusTotal:** [1 engine](https://www.virustotal.com/gui/file/a424e6143cd571242bbd3ad8b4297ebf130118b5fc43077e020d2dfb1806aae1) flags this archive (a generic heuristic for scripts, as in earlier versions; a false positive in our opinion); the other engines report it clean. The number can change when the file is re-scanned: the link shows the current result.

## Quick start

1. Preferably close the game (writing from the main menu and then loading the slot also works).
2. Start the editor, pick a slot on the start screen, edit, press **Save to game**. A summary of the changes is shown first.
3. **More > Restore from backup...** undoes a write at any time.

The save folder (`<Steam>/userdata/<account>/2050650/remote/win64_save`) is found automatically; use the gear button if you have several Steam accounts.

## Known limitations

- Item sizes in the case are taken from real layouts; a few items may still look different in the game.
- Weapon upgrade levels are limited to 0-4 (the highest seen in real saves). Some weapons have fewer upgrades; the editor does not know which.
- Not every weapon can be added as new yet: the Broken Butterfly, the special rocket launchers and some knives are not in the list.
- Names of merchant requests are not stored in the save; the mapping is partly inferred.
- Tested on a limited set of saves and one game version; a game patch may change the save format (the editor then disables structural edits and says so).
- Windows and the Steam version only.

## Feedback

Please open an issue and describe what happened (the editor's **Copy diagnostics** button gives a report without personal data). Please **do not attach your save files** to an issue: a save is tied to your Steam account number (not your password or e-mail), which would become public.

Full list of changes: [CHANGELOG.md](https://github.com/distrix11/RE4-Remake-Save-Editor/blob/main/CHANGELOG.md).

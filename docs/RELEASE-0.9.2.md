# RE4 Save Editor v0.9.2 (pre-release)

An unofficial, local save editor for **Resident Evil 4 (2023 remake), Steam, Windows**. It runs on your own computer and never sends your saves anywhere.

> [!WARNING]
> **Pre-release. Use at your own risk.** Editing saves can corrupt them. The editor makes a backup before every write and keeps a protected first-run copy of every slot, but keep your own copies too. It is best to close the game before saving, and consider turning off Steam Cloud for RE4.

## What is new in 0.9.2

- **New weapons.** **Add weapon…** now adds a new weapon (no upgrades, empty magazine) from a built-in list: 15 weapons of the main game and 7 of Separate Ways. Copying a weapon from your other slots still works.
  - Tested in the game as new weapons: SG-09 R, Punisher, Red9, Blacktail, Sentinel Nine, Riot Gun, Semi Auto Rifle Stingray, LE 5, Fighting Knife; Separate Ways: Sawed-off W-870, SR M1903, Red9. The others in the list are not tested.
  - The game **deletes** a bonus or DLC weapon you have not unlocked (seen with the Chicago Sweeper); the editor warns about these but cannot check it. It may also delete a second copy of a weapon you already carry.
- **Case sizes fixed:** long weapons take more cells than the editor assumed (for example the Riot Gun is 2x8), so a weapon could stick out of the case and be deleted by the game.
- **More saves open correctly:** saves that store the treasures before the case, and saves with an empty object of an unknown class.
- **Reopening works:** after closing the editor and starting it again its window could fail to connect.
- The exclusive upgrade switch sets all values that go with it; the "Sprinter" achievement hint is more honest.

## What you can do

- **Money**: Pesetas and Spinel.
- **Attaché case**: add, copy and delete items from a catalogue of ~220, change counts, ammo and durability, change the **case size** and the **case look** (Silver, Black, Leather, Gold, Classic).
- **Case view**: your case lying down like in the game, with about 150 original 3D-rendered item icons. Drag items to move them, rotate them, or press **Sort** to tidy the case.
- **Weapons**: add a new one or copy one from another slot; upgrade levels 0-4, a **Full upgrade** button and a switch for the exclusive upgrade.
- **Merchant requests**, **treasures**, **achievements** (read-only hints) and an **Advanced** raw field view (asks for a one-time confirmation).
- **Safety**: a "game is running" warning, a summary of every change before writing, writes that are decrypted back and compared before they replace the file, a backup manager and restore, copying one slot into another.

## Download

**`RE4SaveEditor-0.9.2-windows-allinone.zip`** (36.9 MB): extract it anywhere and double-click `RE4SaveEditor.exe`. Nothing to install: Node.js is inside and the save encryption is built in.

SHA-256:

```text
b4f336bb9a3fccfcaaec8de9a212f5717dc44f82893a5c5c0f9d917eec5aebff  RE4SaveEditor-0.9.2-windows-allinone.zip
```

Prefer not to run an `.exe`? Everything is plain JavaScript: download the source code (or `git clone`), run `build.bat` once (it needs [Node.js](https://nodejs.org) 20+ and builds the name dictionary), then double-click `start.bat`. A script-only package (`start.js`, no executables, needs Node.js 20+) is also published on Nexus Mods.

**VirusTotal:** [4 engines](https://www.virustotal.com/gui/file/b4f336bb9a3fccfcaaec8de9a212f5717dc44f82893a5c5c0f9d917eec5aebff) flag this archive (Bkav, Elastic, SentinelOne, NANO-Antivirus). These are generic machine-learning or script heuristics, typical for a small unsigned launcher; the other engines report it clean. The number can change when the file is re-scanned: the link shows the current result. The launcher source is `launcher/Launcher.cs`, the whole editor is open source, and you can build it yourself.

**Windows SmartScreen** may warn about `RE4SaveEditor.exe` because it is not code-signed. The launcher is a short C# program and its full source is in `launcher/Launcher.cs`; the editor is open source (MIT). 

## Quick start

1. Preferably close the game (writing from the main menu and then loading the slot also works).
2. Start the editor, pick a slot at the top, edit, press **Save to game**. A summary of the changes is shown first.
3. **Restore from backup...** undoes a write at any time.

The save folder (`<Steam>/userdata/<account>/2050650/remote/win64_save`) is found automatically; use the gear button if you have several Steam accounts.

## Known limitations

- Item sizes in the case are taken from real layouts; a few items may still look different in the game.
- Weapon upgrade levels are limited to 0-4 (the highest seen in real saves). Some weapons have fewer upgrades; the editor does not know which.
- Not every weapon can be added as new: the main-game W-870, Striker, TMP, CQBR, Broken Butterfly, Bolt Thrower, the rocket launchers and some knives are not in the list. Grenades cannot be added.
- Names of merchant requests are not stored in the save; the mapping is partly inferred.
- Tested on a limited set of saves and one game version; a game patch may change the save format (the editor then disables structural edits and says so).
- Windows and the Steam version only.

## Feedback

Please open an issue and describe what happened (the editor's **Copy diagnostics** button gives a report without personal data). Please **do not attach your save files** to an issue: a save is tied to your Steam account number (not your password or e-mail), which would become public.

Full list of changes: [CHANGELOG.md](https://github.com/distrix11/RE4-Remake-Save-Editor/blob/main/CHANGELOG.md).

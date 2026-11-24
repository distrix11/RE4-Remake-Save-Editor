# RE4 Save Editor v0.9.1 (pre-release)

An unofficial, local save editor for **Resident Evil 4 (2023 remake), Steam, Windows**. It runs on your own computer and never sends your saves anywhere.

> [!WARNING]
> **Pre-release. Use at your own risk.** Editing saves can corrupt them. The editor makes a backup before every write and keeps a protected first-run copy of every slot, but keep your own copies too. It is best to close the game before saving, and consider turning off Steam Cloud for RE4.

## What is new in 0.9.1

- **Separate Ways:** the case look now changes the case of Ada (it changed Leon only before), and Ada's weapons have names and icons (Blast Crossbow, Blacktail AC, Stingray, Tactical Knife) instead of empty cells.
- **Add weapon…** takes a real weapon (with its upgrades, ammo and durability) from another of your slots **of the same campaign** and puts a copy into the case. (A weapon of the other campaign is removed by the game, so it is not offered.)
- **Banner "slot changed outside the editor":** shown when the game (or Steam Cloud) rewrote the slot file after you opened it, with **Reload from disk** / **Keep my copy**; **Save to game** asks before overwriting such a change.
- The update check sees pre-releases, and its banner has GitHub and Nexus Mods buttons.
- Softer advice about the game: closing it before writing is recommended, not required; clearer text about why save files should not be attached to issues; issue forms.

## What you can do

- **Money**: Pesetas and Spinel.
- **Attaché case**: add, copy and delete items from a catalogue of ~220, change counts, ammo and durability, change the **case size** and the **case look** (Silver, Black, Leather, Gold, Classic).
- **Case view**: your case lying down like in the game, with about 150 original 3D-rendered item icons. Drag items to move them, rotate them, or press **Sort** to tidy the case.
- **Weapon upgrades**: levels 0-4, a **Full upgrade** button and a switch for the exclusive upgrade.
- **Merchant requests**, **treasures**, **achievements** (read-only hints) and an **Advanced** raw field view (asks for a one-time confirmation).
- **Safety**: a "game is running" warning, a summary of every change before writing, writes that are decrypted back and compared before they replace the file, a backup manager and restore, copying one slot into another.

## Download

**`RE4SaveEditor-0.9.1-windows-allinone.zip`** (36.9 MB): extract it anywhere and double-click `RE4SaveEditor.exe`. Nothing to install: Node.js is inside and the save encryption is built in.

SHA-256:

```text
edd0db7bbe9b07b31e546c83715a0b102976ea05bbdf7e6705ac9df5d237b703  RE4SaveEditor-0.9.1-windows-allinone.zip
```

Prefer not to run an `.exe`? Everything is plain JavaScript: download the source code (or `git clone`), run `build.bat` once (it needs [Node.js](https://nodejs.org) 20+ and builds the name dictionary), then double-click `start.bat`. A script-only package (`start.js`, no executables, needs Node.js 20+) is also published on Nexus Mods.

**VirusTotal:** [4 of 64 engines](https://www.virustotal.com/gui/file/edd0db7bbe9b07b31e546c83715a0b102976ea05bbdf7e6705ac9df5d237b703) flag this archive (Bkav, Elastic, SentinelOne, NANO-Antivirus). These are generic machine-learning or script heuristics, typical for a small unsigned launcher; Avast, AVG, Avira, BitDefender, ClamAV, CrowdStrike, Dr.Web, ESET and others report it clean. The launcher source is `launcher/Launcher.cs`, the whole editor is open source, and you can build it yourself. The number can change when the file is re-scanned: the link shows the current result.

**Windows SmartScreen** may warn about `RE4SaveEditor.exe` because it is not code-signed. The launcher is about 110 lines of C# and its full source is in `launcher/Launcher.cs`; the editor is open source (MIT). 

## Quick start

1. Preferably close the game (writing from the main menu and then loading the slot also works).
2. Start the editor, pick a slot at the top, edit, press **Save to game**. A summary of the changes is shown first.
3. **Restore from backup...** undoes a write at any time.

The save folder (`<Steam>/userdata/<account>/2050650/remote/win64_save`) is found automatically; use the gear button if you have several Steam accounts.

## Known limitations

- Item sizes in the case are estimates inferred from real layouts; a few items may look different in the game.
- Weapon upgrade levels are limited to 0-4 (the highest seen in real saves). Some weapons have fewer upgrades; the editor does not know which.
- Weapons cannot be created from the catalogue: **Add weapon…** takes one from your other slots of the same campaign, and the copy button duplicates one in the same slot. Grenades cannot be added.
- Names of merchant requests are not stored in the save; the mapping is partly inferred.
- Tested on a limited set of saves and one game version; a game patch may change the save format (the editor then disables structural edits and says so).
- Windows and the Steam version only.

## Feedback

Please open an issue and describe what happened (the editor's **Copy diagnostics** button gives a report without personal data). Please **do not attach your save files** to an issue: a save is tied to your Steam account number (not your password or e-mail), which would become public.

Full list of changes: [CHANGELOG.md](https://github.com/distrix11/RE4-Remake-Save-Editor/blob/main/CHANGELOG.md).

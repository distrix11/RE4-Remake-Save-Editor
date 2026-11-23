# RE4 Save Editor v0.9.0 (pre-release)

An unofficial, local save editor for **Resident Evil 4 (2023 remake), Steam, Windows**. It runs on your own computer and never sends your saves anywhere.

> [!WARNING]
> **Pre-release. Use at your own risk.** Editing saves can corrupt them. The editor makes a backup before every write and keeps a protected first-run copy of every slot, but keep your own copies too. Close the game before saving and consider turning off Steam Cloud for RE4.

## What you can do

- **Money**: Pesetas and Spinel.
- **Attaché case**: add, copy and delete items from a catalogue of ~220, change counts, ammo and durability, change the **case size** and the **case look** (Silver, Black, Leather, Gold, Classic).
- **Case view**: your case lying down like in the game, with about 150 original 3D-rendered item icons. Drag items to move them, rotate them, or press **Sort** to tidy the case.
- **Weapon upgrades**: levels 0-4, a **Full upgrade** button and a switch for the exclusive upgrade.
- **Merchant requests**, **treasures**, **achievements** (read-only hints) and an **Advanced** raw field view (asks for a one-time confirmation).
- **Safety**: a "game is running" warning, a summary of every change before writing, writes that are decrypted back and compared before they replace the file, a backup manager and restore, copying one slot into another.

## Which file to download

Nothing needs to be installed in any of them: the save encryption is built in, and Node.js is either bundled or downloaded once by the start script (official portable build from nodejs.org, checked against a fixed SHA-256).

| File | For whom |
|---|---|
| `RE4SaveEditor-0.9.0-windows-allinone.zip` (36.9 MB) | **Easiest.** Extract anywhere and double-click `RE4SaveEditor.exe`. Node.js is inside. |
| `RE4SaveEditor-0.9.0-github.zip` (3.4 MB) | Double-click `start.bat` (or `start.js`). Uses the Node.js 20+ you have, or asks once to download the portable one. |
| `RE4SaveEditor-0.9.0-nexus.zip` (3.4 MB) | The same without any `.exe`, `.dll` or `.bat` (what Nexus Mods accepts): double-click `start.js`. |

SHA-256:

```text
cd697d8c6597ab0b563079217134d45fa88aa338b956cef5fde58fb920b2e7a9  RE4SaveEditor-0.9.0-windows-allinone.zip
b6482de2f3ef0148f6ae8e3ea47998f427a8f828d93f2c7fa63772d63ba9f9ef  RE4SaveEditor-0.9.0-github.zip
176e401099f6d3c2ed0fa557b98ff9512897b057943009cc0a470c8499b8afe5  RE4SaveEditor-0.9.0-nexus.zip
```

**Windows SmartScreen** may warn about `RE4SaveEditor.exe` because it is not code-signed. The launcher is about 100 lines of C# and its full source is in `launcher/Launcher.cs`; the editor is open source (MIT). With `start.js`, Windows may ask once whether to run the script (it came from the internet): choose Open / Run.

## Quick start

1. Close the game.
2. Start the editor, pick a slot at the top, edit, press **Save to game**. A summary of the changes is shown first.
3. **Restore from backup...** undoes a write at any time.

The save folder (`<Steam>/userdata/<account>/2050650/remote/win64_save`) is found automatically; use the gear button if you have several Steam accounts.

## Known limitations

- Item sizes in the case are estimates inferred from real layouts; a few items may look different in the game.
- Weapon upgrade levels are limited to 0-4 (the highest seen in real saves). Some weapons have fewer upgrades; the editor does not know which.
- Weapons and grenades cannot be added (copy an existing one instead).
- Names of merchant requests are not stored in the save; the mapping is partly inferred.
- Tested on a limited set of saves and one game version; a game patch may change the save format (the editor then disables structural edits and says so).
- Windows and the Steam version only.

## Feedback

Please open an issue and describe what happened (the editor's **Copy diagnostics** button gives a report without personal data). **Never attach your save files** to an issue: they contain your account data.

Full list of changes: [CHANGELOG.md](https://github.com/distrix11/RE4-Remake-Save-Editor/blob/main/CHANGELOG.md).

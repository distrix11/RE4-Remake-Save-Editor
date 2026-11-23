# Changelog

## 0.2.0
- Fixed saves that failed to open ("unknown class" error): the size of the physics data blocks is now found by the shape of their elements instead of guessing the next token.
- Settings window: choose the save folder or Steam account from inside the editor.
- Safer writes: the new file is written to a temporary name, decrypted back and compared, then moved into place.
- Backup manager, plus an automatic first-run copy of every slot that is never deleted by the editor.
- Format guard: if a game update changes the save layout, structural edits are disabled and a banner explains it.
- Copy diagnostics (no personal data) for bug reports.
- Pale-green colour scheme closer to the original game.
- Static case view with vector item icons; the case takes the look of the skin chosen in the save.
- Daily update check (switch in the new About dialog, opened with the ? button). It never downloads anything.
- The launcher opens the editor in its own app-style window and stops the server when the window is closed.
- Small launcher `RE4SaveEditor.exe` and an all-in-one Windows archive with bundled Node.js and encryptor.

## 0.1.0
- First version: money, inventory (add, remove, copy, move on a case map), case size, weapon upgrades, merchant requests, treasures, achievements, restore from backup.

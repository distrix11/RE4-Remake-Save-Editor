# In-game test checklist

The editor can only verify that a save decrypts, parses and round-trips. Whether the game accepts an edit has to be checked in the game.

**Before you start**
- Use a spare slot (**More > Copy slot…** in the editor) and keep Steam Cloud off while testing.
- **Close the game before every write.** If the game has saved a slot since it was started, it refuses that slot after an outside change ("incompatible save data") until it is restarted; the slot itself is fine.
- After loading a slot in the game, **save again in the game** and load that save: the game drops what it does not accept only then.
- Please report results in an issue, with the game version.

## A. Start and safety
1. Start with `Start RE4 Save Editor.js`; **Settings > Create desktop shortcut**; close the editor and start it again from the shortcut (icon shown, window connects). Close and start it a few more times: it must connect every time.
2. **Money**: change Pesetas and Spinel, **Save to game** (the summary lists both), load the slot: the values are shown.
3. **Undo**: make three changes, press Ctrl+Z three times: everything is back. Ctrl+S opens the summary.
4. **Copy slot** to another slot, load the copy in the game.
5. **Restore from backup** (More > Restore from backup…) after a write, load: the old state is back.

## B. Attaché case
6. **Add item** (a First Aid Spray, ammo, a grenade, an egg): each appears in the right place and can be used.
7. **Add here**: right-click an empty place of the Case view, **Add item here…**: the item is on that place in the game.
8. **Drag** an item to another place, **rotate** one (R), press **Sort**: positions in the game are the same as in the editor, nothing overlaps.
9. **Delete** an item, **Copy** an item: the slot loads, both changes are there.
10. **Case size** larger, **Case look** (for example Leather): the game shows the size and the look.
11. **Repair knives** and **Fill ammo stacks**: knives at full durability, stacks full.
12. **Gems**: set a gem in a socket of a treasure (Treasures list): the treasure shows it, the Merchant pays the higher price.

## C. Weapons
13. **Add weapon…**, a new weapon: one pistol, one long weapon (lying or turned), one knife; and one in Separate Ways. All there after a save in the game.
14. **Add weapon…**, a copy from another slot of the same campaign: it keeps its upgrades.
15. **Upgrades**: change a level, **Full upgrade**, the **Exclusive** switch; open the weapon at the Merchant: the levels and the exclusive effect are there.
16. **Upgrade all weapons**: every weapon of the case fully upgraded at the Merchant.
17. **Delete an equipped weapon** (the pistol in the hands, the equipped knife): the slot loads; another weapon can be equipped.
18. **Storage**: put a weapon with a scope into the storage, take another one out to the case; at a typewriter the storage and the case match the editor. The **Elite Knife** (Separate Ways) goes into the storage and stays there.

## D. Other tabs
19. **Merchant requests**: **Complete** one request with flag goals (for example Pest Control), load, talk to the Merchant: the reward can be taken. Blue medallions are left to the game.
20. **Treasures** and **Achievements** open without errors (read-only).

Note which game version you used and whether a game update happened since the last working test.

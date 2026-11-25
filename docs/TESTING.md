# In-game test checklist

The editor can only verify that a save decrypts, parses and round-trips. Whether the game accepts an edit has to be checked in the game.
Use a spare slot (Copy slot… in the editor) and keep Steam Cloud off while testing. Please report results in an issue.

0. **Encryption changed in this build (now built in, JavaScript).** Change something small (e.g. Pesetas), save to the game, start the game and load that slot: does it load, is the change there? Do this first, with a backup.
1. Money: set pesetas to a new value, Save to game, start the game, load the slot. Value shown?
2. Add an item (e.g. First Aid Spray). Does it appear, usable, in the right place?
3. Drag an item to another place in the Case view, save, load. Is the position kept, no overlap?
3b. Press "Sort" in the Case view, save, load: are all items there, none overlapping, the layout the same as in the editor?
3c. Change the "Case look" (for example to Leather), save, load. Is the case skin selectable in the game and does it look the same as in the editor?
3d. **Add weapon…** (Inventory, next to Add item): take a weapon from another slot, save, load. Is it in the case, usable, with the upgrades shown in the editor? Weapons are only offered between slots of the same campaign (a Handcannon put into Separate Ways was removed by the game).
3e. **New weapon** (first section of Add weapon…): add one, save, load the slot, then **save again in the game** (the game drops what it rejects). Check one long weapon and one in Separate Ways. A Chicago Sweeper that is not unlocked disappears.
3f. **Exclusive upgrade**: Full upgrade, switch Exclusive on, save, load. Is the exclusive effect there (merchant, weapon stats)?
3g. Close the editor window and start it again, several times: the window must connect every time.
4. Case size: set a larger case, save, load. Does the case show the new size?
5. Weapon upgrade levels: change one, load, open the weapon at the Merchant.
6. Remove an item and a copied item: does the game load without errors?
7. Copy slot to another slot, load it in the game.
8. Restore from backup, load.

Note which game version you used and whether a game update happened since the last working test.

- Start with "Start RE4 Save Editor.js", press Settings > Create desktop shortcut, close the editor and start it again from the shortcut (icon shown, window connects).

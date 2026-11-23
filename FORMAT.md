# RE4 Remake save format (Steam): notes

What is known about the files in `<Steam>/userdata/<account>/2050650/remote/win64_save`.
These notes come from reverse engineering a handful of saves and may be incomplete or wrong.

## Layer 1: the "DSSS / Lime" container (encryption)

- Layout: header (0x10 bytes), N segments of 0x1220 bytes, footer (0x8C bytes).
  A segment is 4 key banks (0x80 each), 4096 data bytes and a 32-byte checksum.
- The key depends on the SteamID64: `76561197960265728 + <account id>` (the account id is the folder name under `userdata`).
- The last 4 bytes of the file are a Murmur3 signature that is recomputed when packing.
- Decryption, encryption and re-signing: [LimebrellaSharp](https://github.com/mi5hmash/LimebrellaSharp).
- One header word of `data000.bin` is non-standard and is reset by the packer.

## Layer 2: the decrypted data (reflection-style serialization)

- Name hash: `Murmur3_32(UTF-8 name, seed 0xFFFFFFFF)` of class and field names.
  Names are taken from [RE_RSZ](https://github.com/alphazolam/RE_RSZ) (`rszre4.json`).
- File: `u32 magic, u32 version(=1), u32 rootClassHash, u32 fieldHash(GameSaveDataList)` followed by the value.
- A field value starts with a `u32`:
  - `0xFFFFFFFF, elemType, elemSize, count, flag` followed by the elements is an array.
    If `elemType` is `0x11` the elements are objects; otherwise it is `count * elemSize` raw bytes.
  - `0x11, fieldCount, classHash, (fieldHash, value) * fieldCount` is a nested object.
    Objects that are array elements omit the leading `0x11`.
  - `type, size, payload` is a scalar:
    `1` enum/S32, `2` bool (1 byte), `4` u8, `7` u32, `8` S32/U32, `0xA` 64-bit, `0xB` float,
    `0xF` UTF-16 string (`size` counts characters), `0x10` vectors / quaternions (16 or 32 bytes).
- Alignment: a payload whose size is a power of two >= 8 is aligned to its size, measured from the start of
  the original file (so offset + 16, because the 16-byte DSSS header precedes the decrypted buffer).
  The gap before it is filled with garbage bytes; after a payload the position is rounded up to 4.
- Arrays of `0x10` elements of size 48 (physics / transform data) have irregular padding and are copied as opaque blobs.
- The tail of the file (after the last parsed field) is a separate small structure (`SaveFileDetail`)
  with the slot number and the save description strings.

## Files

- `data00-1.bin`: game settings. `data000.bin`: profile template.
- `data001Slot.bin`, `data002Slot.bin`, ...: main campaign slots. `data100Slot.bin`, `data101Slot.bin`: Separate Ways.

## Useful sections inside a slot

`InventoryManager` (PTAS, items, upgrades), `InGameShopManager` (Spinel), `CampaignManager` (difficulty, save count),
`GameClock` (play time in microseconds), `QuestManager` (merchant requests), `DropItemManager` (world pickups),
`GameStatsManager` (per-chapter statistics), `ShootingGalleryManager` (shooting range records).

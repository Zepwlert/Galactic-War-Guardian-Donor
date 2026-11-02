# GWO: Guardians Copy One Player

A Planetary Annihilation: Titans client add-on for [Galactic War Overhaul](https://github.com/quitch/GW-AI-Overhaul) (GWO)

With **Separate loadouts & tech** on, the Guardians normally mirror every player's tech. This add-on makes them copy
**one randomly chosen player per battle** instead. 
If separate loadouts & tech is off it does nothing.

## What it does

Each Fight draws one player at random.

The Guardians then use that player's:

- unit mods (including commander buff cards)
- AI mods
- tech cards (playstyle)
- race

## Install

Requires Galactic War Overhaul (`com.pa.quitch.gwaioverhaul`). Built against GWO 7.7.0.

Put the folder "GW-Guardian-Donor" in your PA `client_mods` folder, enable it in the in-game Community Mods menu.

No GWO file is edited or replaced.

## How it works

The script hooks RequireJS and patches four GWO modules in memory as they load
(`referee_game_files`, `referee_ai`, `referee_config_setup`, `referee_config`) with exact-text replacements.

- If a GWO update changes the text it patches, that module loads untouched and
  `[GWO Guardian donor] ... UNPATCHED` appears in the console. The worst case is stock behaviour.
- A successful draw logs `[GWO Guardian donor] Guardians copy <player>`.
- It must load before GWO's `gw_play` scripts (priority 150, GWO uses 200). If the console never shows "armed"
  before GWO loads, or shows UNPATCHED, open an issue.

## How it was made

I had the idea and since I'm a little nooby coder. It's vibe-coded.

I tested things, pointed in the direction where bugs were at and Claude did Claude things.

## License

MIT, see `LICENSE`.

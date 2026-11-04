# GWO: Guardians Copy One Player

A Planetary Annihilation: Titans client add-on for [Galactic War Overhaul](https://github.com/quitch/GW-AI-Overhaul) (GWO)

With Separate loadouts & tech on, the Guardians normally mirror every player's tech. This add-on makes them copy **one randomly chosen player per battle** instead. If separate loadouts & tech is off it does nothing.

However, if GWO changes code about how the Guardians work, this will likely fail and needs to be updated.

## What it does

Each Fight draws one player at random: the host, each connected viewer, or each per-player co-op AI.
The Guardians then use that player's:

* unit mods (including commander buff cards)
* AI mods
* tech cards (playstyle)
* race

## Install

Requires Galactic War Overhaul (`com.pa.quitch.gwaioverhaul`). Built against GWO 7.7.0; the patch text has also been checked against GWO 7.8.1 and 7.9.1 and the current develop branch.

Put the folder `GW-Guardian-Donor` in your PA `client_mods` folder and enable it in the in-game Community Mods menu.
No GWO file is edited or replaced.

In co-op, every player must install the same version of this mod.

## How it works

The script hooks RequireJS and patches four GWO modules in memory as they load (`referee_game_files`, `referee_ai`, `referee_config_setup`, `referee_config`) with exact-text replacements.

* If a GWO update changes the text it patches, that module loads untouched and `[GWO Guardian donor] ... UNPATCHED` appears in the console. The donor is only used when **all four** modules patched successfully, so the worst case is plain stock behaviour, never a half-applied mix.
* A successful draw logs `[GWO Guardian donor] Guardians copy <player>`.
* It must load before GWO's `gw_play` scripts (priority 150, GWO uses 200). If the console never shows "armed" before GWO loads, or shows UNPATCHED, open an issue.

## Known limitation

MLA tree: when the Guardians' AI-mod scope is "All", GWO gives the Guardians and the host's Sub Commanders the same AI-mod list. A text patch can't separate them, so on that tree the Guardians keep GWO's stock AI mods (every player's) and the host's Sub Commanders keep the host's own. On race trees the Guardians' AI mods come from the donor. Their unit mods, tech cards and race always come from the donor.

## How it was made

I had the idea and since I'm a little nooby coder, it's vibe-coded.
I tested things, pointed in the direction where bugs were at and Claude did Claude things.
Finally I had my big bro pro coder nerd look at it and he said: "yea, it's aight." (although the code style hurt him a little bit on the inside)

## License

MIT, see `LICENSE`.

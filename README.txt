GWO: Guardians Copy One Player (add-on, v1.0.0, built against GWO 7.7.0)

Install: put the folder in your PA mods folder as its own mod, next to
Galactic War Overhaul. No GWO file is edited or replaced.

With "Separate loadouts & tech" on, each Fight draws ONE player at random
(host, each connected viewer, each per-player co-op AI). The Guardians then use
that player's unit mods (incl. commander buff cards), AI mods, tech cards
(playstyle) and race. With it off, nothing changes.

How: the script hooks RequireJS and patches four GWO modules in memory as they
load (referee_game_files, referee_ai, referee_config_setup, referee_config).
If a GWO update changes the text it patches, that module loads untouched and
"[GWO Guardian donor] ... UNPATCHED" appears in the console. A successful draw
logs "[GWO Guardian donor] Guardians copy <player>".

Needs to load before GWO's gw_play scripts (priority 150 < GWO's 200). If the
console never shows "armed" before GWO loads, or shows UNPATCHED, tell me.

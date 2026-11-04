// GWO add-on: The Guardians copy ONE random player, not every player.
//
// GWO keeps the code that makes the Guardians "mirror" the players inside
// private functions of three referee modules, so nothing outside can call into
// it. Instead of replacing those files, this script sits in RequireJS's loader:
// when GWO's referee modules are requested it reads their source, applies a few
// exact-text replacements, and hands the result to RequireJS in place of the
// file. Nothing on disk changes. If a replacement does not match (a GWO update
// changed the text), that module loads UNPATCHED and a message is logged. The
// donor is only used once ALL four modules loaded patched; otherwise every
// patched piece falls back to stock behaviour.
//
// With "Separate loadouts & tech" on, one of {host, each connected viewer, each
// per-player co-op AI} is drawn once per Fight, and the Guardians take that
// player's unit mods, AI mods, tech cards (playstyle) and race.
(function () {
  var TAG = "[GWO Guardian donor] ";
  var BASE = "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/";
  var D = "window.gwoGuardianDonor";

  // ---- the donor ---------------------------------------------------------
  var chosen = null; // {key, inventory}, for this Fight
  var patchedModules = {}; // url -> true once that module loaded patched

  var modsOf = function (inv) {
    return _.isFunction(inv.mods) ? inv.mods() : inv.mods || [];
  };
  var cardsOf = function (inv) {
    return _.isFunction(inv.cards) ? inv.cards() : inv.cards || [];
  };

  // refereeCoop is passed in by the patched code, which has it in scope.
  var participants = function (game, refereeCoop, clients, coopAis) {
    var list = [{ key: "host", inventory: game.inventory() }];
    _.forEach(
      refereeCoop.getConnectedViewerInventories(game, clients),
      function (v) {
        list.push({
          key: "viewer:" + refereeCoop.clientKey(v.client.id, v.client.name),
          inventory: v.inventory,
        });
      }
    );
    _.forEach(refereeCoop.launchAiInventories(coopAis), function (a) {
      list.push({ key: "ai:" + a.tag, inventory: a.inventory });
    });
    return list;
  };

  var allPatched = function () {
    return _.every(_.keys(PATCHES), function (k) {
      return patchedModules[k] === true;
    });
  };

  var api = {
    // The donor for this Fight, or null when per-player tech is off (stock
    // behaviour). Later callers without refereeCoop just get the first choice.
    pick: function (game, refereeCoop, clients, coopAis) {
      if (!game || !game.perPlayerTechCards()) {
        return null;
      }
      // All four modules must be patched, or the pieces would disagree.
      if (!allPatched()) {
        return null;
      }
      if (chosen) {
        return chosen;
      }
      if (!refereeCoop) {
        return null;
      }
      var list = participants(game, refereeCoop, clients, coopAis);
      chosen = list[Math.floor(Math.random() * list.length)];
      console.log(TAG + "Guardians copy " + chosen.key);
      return chosen;
    },
    modsOf: modsOf,
    cardsOf: cardsOf,
    // fallback when per-player tech is off or nothing was chosen
    cards: function (game, fallback) {
      var d = api.pick(game);
      return d ? cardsOf(d.inventory) : fallback;
    },
    raceOf: function (game, gwoRaces, fallback, refereeCoop, clients, coopAis) {
      var d = api.pick(game, refereeCoop, clients, coopAis);
      return d ? gwoRaces.raceOf(d.inventory) : fallback;
    },
    reset: function () {
      chosen = null;
    },
  };
  window.gwoGuardianDonor = api;

  // A new Fight draws again. The pick also lapses whenever no launch is
  // running, in case the observable is not there yet when this loads.
  var watchLaunches = function () {
    try {
      if (ko.isObservable(model.launchingFight)) {
        model.launchingFight.subscribe(function (launching) {
          if (launching) {
            chosen = null;
          }
        });
        return true;
      }
    } catch (e) {
      /* retried below */
    }
    return false;
  };
  if (!watchLaunches()) {
    setTimeout(watchLaunches, 0);
  }

  // ---- the patches -------------------------------------------------------
  // Each: exact text to find (must occur once) and what replaces it.
  var PATCHES = {};
  PATCHES[BASE + "referee_game_files.js"] = [
    {
      // The Guardians' unit mods: the donor's alone.
      find:
        "  var guardianMods = function (game, hostMods, coopAis) {\n",
      replace:
        "  var guardianMods = function (game, hostMods, coopAis) {\n" +
        "    var gwoDonor = " + D + ".pick(game, refereeCoop, undefined, coopAis);\n" +
        "    if (gwoDonor) {\n" +
        "      return " + D + ".modsOf(gwoDonor.inventory);\n" +
        "    }\n",
    },
    {
      // The Guardians' race: the donor's.
      find:
        "          return ai.mirrorMode ? playerRace : gwoRaces.raceOf(armyOf(n));\n",
      replace:
        "          return ai.mirrorMode\n" +
        "            ? " + D + ".raceOf(game, gwoRaces, playerRace, refereeCoop, undefined, coopAis)\n" +
        "            : gwoRaces.raceOf(armyOf(n));\n",
    },
  ];
  PATCHES[BASE + "referee_ai.js"] = [
    {
      // Race trees: the Guardians' mods and race come from the donor. Only
      // the Guardians' list changes; host Sub Commanders keep every player.
      find:
        "    var enemyMods = guardians ? everyPlayer : [];\n" +
        "    var hostSubCommanderMods = guardians ? everyPlayer : [inventory];\n",
      replace:
        "    var gwoDonor = guardians && " + D + ".pick(game, refereeCoop, connectedClients, coopAis);\n" +
        "    var enemyMods = guardians\n" +
        "      ? gwoDonor\n" +
        "        ? [gwoDonor.inventory]\n" +
        "        : everyPlayer\n" +
        "      : [];\n" +
        "    var hostSubCommanderMods = guardians ? everyPlayer : [inventory];\n",
    },
    {
      find: "      guardians ? playerRace : gwoRaces.raceOf(ai),\n",
      replace:
        "      guardians\n" +
        "        ? gwoDonor\n" +
        "          ? gwoRaces.raceOf(gwoDonor.inventory)\n" +
        "          : playerRace\n" +
        "        : gwoRaces.raceOf(ai),\n",
    },
  ];
  PATCHES[BASE + "referee_config_setup.js"] = [
    {
      find:
        "      ? gwoRaces.raceOf(model.game().inventory())\n      : gwoRaces.raceOf(ai);\n",
      replace:
        "      ? " + D + ".raceOf(\n" +
        "          model.game(),\n" +
        "          gwoRaces,\n" +
        "          gwoRaces.raceOf(model.game().inventory())\n" +
        "        )\n" +
        "      : gwoRaces.raceOf(ai);\n",
    },
  ];
  PATCHES[BASE + "referee_config.js"] = [
    {
      // The tech cards the Guardians' playstyle is built from.
      find: "    setupPrimaryAiAndMinions(\n      ai,\n      connectedPlayerCards,\n",
      replace:
        "    setupPrimaryAiAndMinions(\n      ai,\n" +
        "      ai.mirrorMode\n" +
        "        ? " + D + ".cards(game, connectedPlayerCards)\n" +
        "        : connectedPlayerCards,\n",
    },
  ];

  var countOf = function (text, needle) {
    return text.split(needle).length - 1;
  };

  // The patched source, or null if any replacement does not match exactly once.
  var patchSource = function (url, text) {
    var patches = PATCHES[url];
    for (var i = 0; i < patches.length; i++) {
      if (countOf(text, patches[i].find) !== 1) {
        console.error(
          TAG + "patch " + (i + 1) + " does not match in " + url +
            " (GWO changed?) - loading it UNPATCHED."
        );
        return null;
      }
    }
    for (var j = 0; j < patches.length; j++) {
      text = text.replace(patches[j].find, function () {
        return patches[j].replace;
      });
    }
    return text;
  };

  api._patches = PATCHES; // exposed for tests
  api._patchSource = patchSource;

  // ---- the loader hook ---------------------------------------------------
  var req = window.requirejs || window.require;
  if (!req || !_.isFunction(req.load)) {
    console.error(TAG + "RequireJS loader not found - Guardians are stock.");
    return;
  }
  var stockLoad = req.load;

  req.load = function (context, moduleName, url) {
    var key = _.find(_.keys(PATCHES), function (k) {
      return url && url.split("?")[0] === k;
    });
    if (!key) {
      return stockLoad.apply(this, arguments);
    }
    var args = arguments;
    var self = this;
    var fallBack = function (why) {
      console.error(TAG + why + " (" + key + ") - loading it UNPATCHED.");
      stockLoad.apply(self, args);
    };
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.onload = function () {
        var source = (xhr.responseText || "").replace(/\r\n/g, "\n");
        var patched = source && patchSource(key, source);
        if (!patched) {
          return fallBack("could not patch");
        }
        try {
          // An anonymous define() in the text queues itself; completeLoad
          // then names it for the module that asked.
          (0, eval)(patched + "\n//# sourceURL=" + url);
          context.completeLoad(moduleName);
          patchedModules[key] = true;
        } catch (e) {
          fallBack("patched source failed: " + (e && e.message));
        }
      };
      xhr.onerror = function () {
        fallBack("could not read the file");
      };
      xhr.send();
    } catch (e) {
      fallBack("loader error: " + (e && e.message));
    }
  };
  console.log(TAG + "armed");
})();

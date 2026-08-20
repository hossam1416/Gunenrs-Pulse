"use strict";

/* ================================================================
   PLAYER TACTICS DATA — Loaded from Django/Admin JSON
   Source: window.PLAYER_TACTICS_DATA
================================================================ */

var PLAYER_TACTICS_DATA = window.PLAYER_TACTICS_DATA || {};

/* ================================================================
   MAIN DATA FROM JSON
================================================================ */

var ROLES_DATA = PLAYER_TACTICS_DATA.rolesData || {};

var FORMATIONS = PLAYER_TACTICS_DATA.formations || [];

var PLAYERS = PLAYER_TACTICS_DATA.players || [];

var SPT_ROLES = PLAYER_TACTICS_DATA.sptRoles || [];

var SPT_DEFAULTS = PLAYER_TACTICS_DATA.sptDefaults || {};

var CURRENT_TACTIC = PLAYER_TACTICS_DATA.currentTactic || {
  formationId: "4-3-3-holding",
  assignments: {},
  playerRoles: {},
  sptAssignments: {},
  tactics: null,
};

var CURRENT_PLAYER_SHORT = PLAYER_TACTICS_DATA.currentPlayerShort || "";

/* ================================================================
   UI HELPERS FROM JSON
   لازم يكونوا داخل player_tactics.json باسم:
   focusColors
   roleShortDesc
================================================================ */

var FOCUS_COLORS = PLAYER_TACTICS_DATA.focusColors || {};

var ROLE_SHORT_DESC = PLAYER_TACTICS_DATA.roleShortDesc || {};

/* ================================================================
   SAFETY FALLBACKS
================================================================ */

if (!ROLES_DATA || typeof ROLES_DATA !== "object") {
  ROLES_DATA = {};
}

if (!Array.isArray(FORMATIONS)) {
  FORMATIONS = [];
}

if (!Array.isArray(PLAYERS)) {
  PLAYERS = [];
}

if (!Array.isArray(SPT_ROLES)) {
  SPT_ROLES = [];
}

if (!SPT_DEFAULTS || typeof SPT_DEFAULTS !== "object") {
  SPT_DEFAULTS = {};
}

if (!CURRENT_TACTIC || typeof CURRENT_TACTIC !== "object") {
  CURRENT_TACTIC = {
    formationId: "4-3-3-holding",
    assignments: {},
    playerRoles: {},
    sptAssignments: {},
    tactics: null,
  };
}

if (!CURRENT_PLAYER_SHORT) {
  CURRENT_PLAYER_SHORT = "";
}

if (!FOCUS_COLORS || typeof FOCUS_COLORS !== "object") {
  FOCUS_COLORS = {};
}

if (!ROLE_SHORT_DESC || typeof ROLE_SHORT_DESC !== "object") {
  ROLE_SHORT_DESC = {};
}

/* ================================================================
   IMAGE PATH FIX FOR DJANGO STATIC
   يحول الصور من ../images/name.jpg إلى /static/images/name.jpg
================================================================ */

PLAYERS = PLAYERS.map(function (player) {
  if (!player.img) {
    return player;
  }

  if (player.img.startsWith("/static/images/")) {
    player.img = player.img.replace("/static/images/", "/static/images/");
  }

  return player;
});

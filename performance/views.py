import json
from decimal import Decimal

from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.core.exceptions import MultipleObjectsReturned

from .models import Player
from training.views import get_current_player_context, get_linked_player_for_user, _fix_image_path


def to_float(value, default=0):
    if value is None:
        return default

    if isinstance(value, Decimal):
        return float(value)

    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def to_int(value, default=0):
    if value is None:
        return default

    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def format_date(value, fmt="%d/%m/%Y"):
    if not value:
        return "—"

    try:
        return value.strftime(fmt)
    except Exception:
        return "—"


def format_season(value):
    if not value:
        return ""

    start_year = value.year if value.month >= 8 else value.year - 1
    return f"{start_year}/{str(start_year + 1)[-2:]}"


def get_value(obj, field_name, default=0):
    return getattr(obj, field_name, default)


def fitness_type(value):
    value = to_int(value, 0)

    if value >= 75:
        return "green"

    if value >= 50:
        return "amber"

    return "red"


def player_img(player):
    """
    يأخذ صورة اللاعب من قاعدة البيانات.
    image_url يجب أن تكون قادمة من JSON field: img
    مثال: /static/images/raya.jpg
    """

    img = get_value(player, "image_url", "")

    if img:
        return img

    return "/static/images/white_gun.jpg"


def get_shared_context():
    players = Player.objects.prefetch_related("match_history").all()

    players_list = []
    perf_data = []
    tact_data = []
    match_history_data = []

    for p in players:
        img = player_img(p)

        position_display = p.get_position_display()
        position_group = p.position

        market_value = to_float(get_value(p, "market_value", 0), 0)
        fitness = to_int(get_value(p, "fitness_percentage", 0), 0)
        medical_status = get_value(p, "medical_status", "fit") or "fit"

        # ─────────────────────────────────────────────
        # 1. Basic Info — Perform-1.js
        # ─────────────────────────────────────────────
        players_list.append(
            {
                "name": p.name,
                "number": p.number,
                "primary": position_display,
                "secondary": get_value(p, "secondary_position", "") or "—",
                "pos": position_display,
                "posGroup": position_group,
                "age": p.age,
                "dob": format_date(get_value(p, "birth_date", None)),
                "height": get_value(p, "height", "—"),
                "weight": get_value(p, "weight", "—"),
                "foot": get_value(p, "preferred_foot", "—") or "—",
                "value": f"€{market_value:g}m",
                "valueNum": market_value,
                "trend": get_value(p, "trend", "€0") or "€0",
                "trendType": get_value(p, "trend_type", "neutral") or "neutral",
                "startDate": format_date(get_value(p, "contract_start", None)),
                "expiry": format_date(get_value(p, "contract_expiry", None)),
                "fitness": fitness,
                "fitnessType": fitness_type(fitness),
                "medical": (
                    p.get_medical_status_display()
                    if hasattr(p, "get_medical_status_display")
                    else medical_status
                ),
                "medicalType": medical_status.lower(),
                "yellowCards": to_int(get_value(p, "yellow_cards", 0)),
                "redCards": to_int(get_value(p, "red_cards", 0)),
                "img": img,
            }
        )

        # ─────────────────────────────────────────────
        # 2. Performance — Perform-2.js
        # ─────────────────────────────────────────────
        perf_data.append(
            {
                "name": p.name,
                "pos": position_display,
                "number": p.number,
                "posGroup": position_group,
                "img": img,
                "mp": to_int(get_value(p, "matches_played", 0)),
                "gs": to_int(
                    get_value(
                        p,
                        "games_started",
                        get_value(p, "matches_played", 0),
                    )
                ),
                "min": f"{to_int(get_value(p, 'minutes_played', 0)):,}",
                "subIn": to_int(get_value(p, "sub_in", 0)),
                "out": to_int(get_value(p, "sub_out", 0)),
                "g": to_int(get_value(p, "goals", 0)),
                "a": to_int(get_value(p, "assists", 0)),
                "xg": to_float(get_value(p, "xg", 0.0)),
                "xa": to_float(get_value(p, "xa", 0.0)),
                "conv": f"{to_float(get_value(p, 'conversion_rate', 0)):g}%",
                "sh": to_int(get_value(p, "shots", 0)),
                "sot": f"{to_float(get_value(p, 'shots_on_target_pct', 0)):g}%",
                "inBox": to_int(get_value(p, "shots_in_box", 0)),
                "outBox": to_int(get_value(p, "shots_out_box", 0)),
                "fkAcc": f"{to_float(get_value(p, 'free_kick_accuracy', 0)):g}%",
                "yc": to_int(get_value(p, "yellow_cards", 0)),
                "rc": to_int(get_value(p, "red_cards", 0)),
                "fc": to_int(get_value(p, "fouls_committed", 0)),
                "fs": to_int(get_value(p, "fouls_suffered", 0)),
                "off": to_int(get_value(p, "offsides", 0)),
            }
        )

        # ─────────────────────────────────────────────
        # 3. Tactical Analysis — Perform-3.js
        # ─────────────────────────────────────────────
        tact_data.append(
            {
                "name": p.name,
                "pos": position_display,
                "number": p.number,
                "posGroup": position_group,
                "img": img,
                "passAcc": f"{to_float(get_value(p, 'pass_accuracy', 0)):g}%",
                "keyPasses": to_float(get_value(p, "key_passes", 0)),
                "final3rd": to_int(get_value(p, "final_third_passes", 0)),
                "longBalls": f"{to_float(get_value(p, 'long_balls_accuracy', 0)):g}%",
                "throughBalls": to_int(get_value(p, "through_balls", 0)),
                "tackles": f"{to_float(get_value(p, 'tackles_won', 0)):g}%",
                "interceptions": to_float(get_value(p, "interceptions", 0)),
                "ballRecov": to_float(get_value(p, "ball_recoveries", 0)),
                "blockedShots": to_float(get_value(p, "blocked_shots", 0)),
                "clearances": to_float(get_value(p, "clearances", 0)),
                "totalDuels": f"{to_float(get_value(p, 'total_duels_won', 0)):g}%",
                "aerial": f"{to_float(get_value(p, 'aerial_duels_won', 0)):g}%",
                "ground": f"{to_float(get_value(p, 'ground_duels_won', 0)):g}%",
                "dribbles": f"{to_float(get_value(p, 'dribbles_success', 0)):g}%",
                "distance": to_float(get_value(p, "distance_covered", 0)),
                "hiSprints": to_int(get_value(p, "sprints", 0)),
                "topSpeed": to_float(get_value(p, "top_speed", 0)),
                "density": to_int(get_value(p, "density", 80)),
            }
        )

        # ─────────────────────────────────────────────
        # 4. Match History — Perform-4.js
        # ─────────────────────────────────────────────
        matches = []

        for m in p.match_history.all():
            card = get_value(m, "card", "None")

            matches.append(
                {
                    "date": format_date(get_value(m, "date", None), "%d %b %Y"),
                    "opponent": get_value(m, "opponent", "—"),
                    "home": get_value(m, "home", True),
                    "result": get_value(m, "result", "D"),
                    "score": get_value(m, "score", "0-0"),
                    "min": to_int(get_value(m, "minutes_played", 0)),
                    "g": to_int(get_value(m, "goals", 0)),
                    "a": to_int(get_value(m, "assists", 0)),
                    "yc": 1 if card == "Yellow" else 0,
                    "rc": 1 if card == "Red" else 0,
                    "rating": to_float(get_value(m, "rating", 0)),
                    # GK
                    "saves": to_int(get_value(m, "saves", 0)),
                    "punches": to_int(get_value(m, "punches", 0)),
                    # DEF
                    "tackles": to_int(get_value(m, "tackles", 0)),
                    "clearances": to_int(get_value(m, "clearances", 0)),
                    # MID
                    "chancesCreated": to_int(
                        get_value(m, "chances_created", 0)
                    ),
                    "interceptions": to_int(get_value(m, "interceptions", 0)),
                    # FWD
                    "shots": to_int(get_value(m, "shots", 0)),
                    "dribbles": to_int(get_value(m, "dribbles", 0)),
                }
            )

        match_history_data.append(
            {
                "name": p.name,
                "pos": position_display,
                "number": p.number,
                "posGroup": position_group,
                "img": img,
                "matches": matches,
            }
        )

    return {
        "players_json": json.dumps(players_list, ensure_ascii=False),
        "perf_data_json": json.dumps(perf_data, ensure_ascii=False),
        "tact_data_json": json.dumps(tact_data, ensure_ascii=False),
        "match_history_json": json.dumps(match_history_data, ensure_ascii=False),
    }


@login_required
def perform_basic_info(request):
    return render(request, "3-performance/perform5.html", get_shared_context())


@login_required
def perform_stats(request):
    return render(request, "3-performance/perform5.html", get_shared_context())


@login_required
def perform_tactical(request):
    return render(request, "3-performance/perform5.html", get_shared_context())


@login_required
def perform_history(request):
    return render(request, "3-performance/perform5.html", get_shared_context())


@login_required
def player_performance(request):
    linked_player = get_linked_player_for_user(request.user)
    player = None
    player_image_url = _fix_image_path(linked_player.img) if linked_player else ""

    if linked_player:
        try:
            player = Player.objects.get(number=linked_player.number)
        except Player.DoesNotExist:
            try:
                player = Player.objects.get(name=linked_player.name)
            except (Player.DoesNotExist, MultipleObjectsReturned):
                player = None

    if player:
        matches = []
        for match in player.match_history.all():
            matches.append({
                "date": match.date.strftime("%d/%m/%y"),
                "season": format_season(match.date),
                "comp": match.competition.lower().replace(" ", "-"),
                "compLabel": match.competition,
                "opponent": match.opponent,
                "home": match.home,
                "score": match.score,
                "result": match.result,
                "min": match.minutes_played,
                "role": "starter" if match.minutes_played >= 60 else "sub",
                "goals": match.goals,
                "assists": match.assists,
                "shots": match.shots,
                "keyPass": match.chances_created,
                "rating": match.rating,
                "motm": match.rating >= 8.0,
            })

        player_performance_data = {
            "player": {
                "name": player.name,
                "number": player.number,
                "position": player.get_position_display(),
                "photo": player_image_url,
            },
            "matches": matches,
            "message": "" if matches else "No match history data found for this player.",
        }
    else:
        player_performance_data = {
            "player": {
                "name": linked_player.name if linked_player else "",
                "number": linked_player.number if linked_player else "",
                "position": linked_player.primary if linked_player else "",
                "photo": player_image_url,
            },
            "matches": [],
            "message": (
                "No performance data found for this linked player."
                if linked_player
                else "No player profile is linked to this account."
            ),
        }

    player_performance_json = json.dumps(
        player_performance_data,
        ensure_ascii=False,
    )

    context = {
        "player_performance_json": player_performance_json,
        "player": linked_player,
        "player_image_url": player_image_url,
    }
    context.update(get_current_player_context(request.user))

    return render(request, "3-performance/perform_p.html", context)

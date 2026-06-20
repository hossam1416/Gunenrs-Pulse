import json

from django.shortcuts import render
from django.contrib.auth.decorators import login_required

from .models import DashboardData
from training.views import (
    get_current_player_context,
    get_linked_player_for_user,
    _fix_image_path,
)


def get_dashboard_json(name, default_value):
    """
    Get JSON data from DashboardData model.
    If the record does not exist, return the default value.
    """

    obj = DashboardData.objects.filter(name=name).first()

    if obj and obj.data:
        return json.dumps(obj.data, ensure_ascii=False)

    return json.dumps(default_value, ensure_ascii=False)


def get_dashboard_data(name, default_value):
    obj = DashboardData.objects.filter(name=name).first()

    if obj and obj.data:
        return obj.data

    return default_value


def build_player_dashboard_data(request):
    data = get_dashboard_data("Player Dashboard", {})
    if not isinstance(data, dict):
        data = {}

    linked_player = get_linked_player_for_user(request.user)
    if not linked_player:
        return {
            "player": {},
            "error": "No player profile is linked to this account.",
        }

    player_data = dict(data.get("player") or {})
    player_data.update({
        "name": linked_player.name,
        "number": linked_player.number,
        "position": linked_player.primary or linked_player.posGroup or "",
        "photo": _fix_image_path(linked_player.img),
        "fitStatus": "FIT" if (linked_player.fitness or 0) >= 90 else "MONITOR",
        "readiness": linked_player.fitness,
        "bio": [
            {"label": "Squad Number", "val": f"#{linked_player.number}" if linked_player.number else "—"},
            {"label": "Short Name", "val": linked_player.short or "—"},
            {"label": "Position", "val": linked_player.primary or "—"},
            {"label": "Position Group", "val": linked_player.posGroup or "—"},
            {"label": "Fitness", "val": f"{linked_player.fitness}%"},
        ],
    })

    data = dict(data)
    data["player"] = player_data
    return data


@login_required
def home_view(request):
    """
    Coach Home Page
    Template: templates/2-index/index.html
    """

    dashboard_json = get_dashboard_json("Home Dashboard", {})
    matches_json = get_dashboard_json("Matches Data", [])

    context = {
        "dashboard_json": dashboard_json,
        "matches_json": matches_json,
    }

    return render(request, "2-index/index.html", context)


@login_required
def player_home_view(request):
    """
    Player Home Page
    Template: templates/2-index/player-index.html
    """

    player_dashboard_json = json.dumps(
        build_player_dashboard_data(request),
        ensure_ascii=False,
    )

    context = {
        "player_dashboard_json": player_dashboard_json,
    }
    context.update(get_current_player_context(request.user))

    return render(request, "2-index/player-index.html", context)

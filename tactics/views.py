import os
import json

from django.conf import settings
from django.shortcuts import render
from django.contrib.auth.decorators import login_required

from .models import Player, PlayerTacticsData
from training.views import get_current_player_context, get_linked_player_for_user


@login_required
def tactics_page(request):
    data_dir = os.path.join(settings.BASE_DIR, "static", "data")

    formations_file = os.path.join(data_dir, "formations_data.json")
    formations_data = []
    if os.path.exists(formations_file):
        with open(formations_file, "r", encoding="utf-8") as f:
            formations_data = json.load(f)

    roles_file = os.path.join(data_dir, "roles_data.json")
    roles_data = {}
    if os.path.exists(roles_file):
        with open(roles_file, "r", encoding="utf-8") as f:
            roles_data = json.load(f)

    all_players = Player.objects.all()
    players_data = []

    for p in all_players:
        img_url = "/static/images/default.jpg"

        if p.img:
            img_str = str(p.img)

            if img_str.startswith("/static/") or img_str.startswith("http"):
                img_url = img_str
            else:
                try:
                    img_url = p.img.url
                except Exception:
                    pass

        players_data.append(
            {
                "name": p.name,
                "short": p.short or p.name,
                "number": p.number,
                "primary": p.primary,
                "posGroup": p.posGroup,
                "img": img_url,
            }
        )

    context = {
        "roles_json": json.dumps(roles_data, ensure_ascii=False),
        "formations_json": json.dumps(formations_data, ensure_ascii=False),
        "players_json": json.dumps(players_data, ensure_ascii=False),
    }

    return render(request, "5-tacitcs/tactics.html", context)


@login_required
def player_tactics_page(request):
    linked_player = get_linked_player_for_user(request.user)
    obj = PlayerTacticsData.objects.filter(
        name="Player Tactics"
    ).first()

    if obj and obj.data:
        data = dict(obj.data)
    else:
        data = {
            "rolesData": {},
            "formations": [],
            "players": [],
            "sptRoles": [],
            "sptDefaults": {},
            "currentTactic": {
                "formationId": "4-3-3-holding",
                "assignments": {},
                "playerRoles": {},
                "sptAssignments": {},
                "tactics": None,
            },
            "currentPlayerShort": "",
        }

    if linked_player:
        data["currentPlayerShort"] = linked_player.short or linked_player.name
        data["currentPlayer"] = {
            "id": linked_player.id,
            "name": linked_player.name,
            "short": linked_player.short or linked_player.name,
            "number": linked_player.number,
            "primary": linked_player.primary,
            "posGroup": linked_player.posGroup,
        }
    else:
        data["currentPlayerShort"] = ""
        data["currentPlayer"] = None
        data["error"] = "No player profile is linked to this account."

    player_tactics_json = json.dumps(
        data,
        ensure_ascii=False,
    )

    context = {
        "player_tactics_json": player_tactics_json,
    }
    context.update(get_current_player_context(request.user))

    return render(request, "5-tacitcs/player-tactics.html", context)


@login_required
def dynamic_tactics_js(request):
    return render(
        request,
        "js/tactics-data-player.js",
        content_type="application/javascript",
    )

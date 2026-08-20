import json

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST

from .models import (
    Player,
    TrainingSection,
    PublishedTrainingSession,
)


def get_linked_player_for_user(user):
    if not user or not user.is_authenticated:
        return None

    try:
        return user.player
    except Player.DoesNotExist:
        return None
    except AttributeError:
        return None


def get_current_player_context(user):
    linked_player = get_linked_player_for_user(user)
    if not linked_player:
        return {
            "current_player": None,
            "player_page_error": "No player profile is linked to this account.",
        }

    return {
        "current_player": {
            "id": linked_player.id,
            "name": linked_player.name,
            "short": linked_player.short or linked_player.name,
            "number": linked_player.number,
            "primary": linked_player.primary or "",
            "posGroup": linked_player.posGroup or "",
            "img": _fix_image_path(linked_player.img),
        },
        "player_page_error": "",
    }


def _fix_image_path(path):
    if not path:
        return "/static/images/default.jpg"

    path = str(path)

    if path.startswith("/static/") or path.startswith("http"):
        return path

    if path.startswith("../images/"):
        return path.replace("../images/", "/static/images/")

    return f"/static/images/{path}"


def _build_players_data():
    players_data = []

    for player in Player.objects.all().order_by("id"):
        goals = assists = minutes = 0
        try:
            goals = player.performance.goals
            assists = player.performance.assists
            minutes = player.performance.minutes
        except Exception:
            pass

        medical = "Fit"
        try:
            latest = player.injuries.order_by("-last_injury_date").first()
            if latest and latest.status:
                medical = latest.status
        except Exception:
            pass

        players_data.append({
            "id": player.id,
            "name": player.name,
            "short": player.short or player.name,
            "number": player.number,
            "pos": player.primary or "",
            "posGroup": player.posGroup or "",
            "img": _fix_image_path(player.img),
            "fitness": player.fitness or 100,
            "medical": medical,
            "minutesPlayed": minutes,
            "goals": goals,
            "assists": assists,
            "trend": "flat",
        })

    return players_data


def _attrs_to_list(attrs):
    if not attrs:
        return []

    if isinstance(attrs, list):
        return attrs

    text = str(attrs).strip()

    if not text:
        return []

    # لو كانت مخزنة كـ JSON string
    if text.startswith("["):
        try:
            return json.loads(text)
        except Exception:
            pass

    return [x.strip() for x in text.split(",") if x.strip()]


def _build_sections_data():
    sections_data = []

    for section in TrainingSection.objects.prefetch_related("drills").all().order_by("id"):
        drills_data = []

        for drill in section.drills.all().order_by("id"):
            drills_data.append({
                "id": drill.drill_id,
                "name": drill.name,
                "shortName": drill.short_name or drill.name,
                "focusLabel": drill.focus_label or "",
                "intensity": drill.intensity or "",
                "duration": drill.duration or 0,
                "attrs": _attrs_to_list(drill.attrs),
                "video": drill.video or "",
                "description": drill.description or "",
            })

        sections_data.append({
            "id": section.section_id,
            "name": section.name,
            "icon": section.icon or "",
            "description": section.description or "",
            "drills": drills_data,
        })

    return sections_data


def _build_training_data():
    return {
        "players": _build_players_data(),
        "sections": _build_sections_data(),
    }


def _get_published_session():
    obj = PublishedTrainingSession.objects.filter(
        name=PublishedTrainingSession.KEY
    ).first()

    if obj and obj.session_data:
        return obj.session_data

    return {
        "activeSectionId": "passing",
        "activeDrillId": "p1",
        "playerIds": [],
        "drillPlayerMap": {},
        "date": "",
        "startTime": "10:00",
        "duration": 60,
    }


def _get_player_id_for_user(request):
    linked_player = get_linked_player_for_user(request.user)
    if linked_player:
        return linked_player.id

    if request.user.is_staff or request.user.is_superuser:
        param = request.GET.get("playerId")
        if not param:
            return None
        try:
            return int(param)
        except ValueError:
            return None

    return None


@login_required
def coach_training_page(request):
    return render(request, "6-train/training-session.html", {
        "training_data": _build_training_data(),
    })


@login_required
def training_modal_page(request):
    return render(request, "6-train/training-modal.html", {
        "training_data": _build_training_data(),
    })


@login_required
def training_history_page(request):
    return render(request, "6-train/training-history.html", {
        "training_data": _build_training_data(),
    })


@login_required
def training_full_drill_page(request):
    return render(request, "6-train/training-full-drill.html", {
        "training_data": _build_training_data(),
    })


@login_required
@require_POST
def save_training_session(request):
    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"ok": False, "error": "Invalid JSON"}, status=400)

    required = ["activeSectionId", "activeDrillId", "drillPlayerMap"]

    for field in required:
        if field not in payload:
            return JsonResponse({
                "ok": False,
                "error": f"Missing field: {field}",
            }, status=400)

    obj, created = PublishedTrainingSession.objects.get_or_create(
        name=PublishedTrainingSession.KEY,
        defaults={"session_data": payload},
    )

    if not created:
        obj.session_data = payload
        obj.save()

    return JsonResponse({"ok": True, "created": created})


@login_required
def player_training_page(request):
    player_id = _get_player_id_for_user(request)

    training_data = _build_training_data()
    training_data["currentPlayerId"] = player_id
    training_data["publishedSession"] = _get_published_session()

    context = {
        "training_data": training_data,
    }
    context.update(get_current_player_context(request.user))

    return render(request, "6-train/player-training.html", context)

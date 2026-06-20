import json
from datetime import datetime

from django.shortcuts import render, redirect, get_object_or_404
from .models import Player


def get_player_image_url(player):
    """
    ترتيب اختيار الصورة:
    1. إذا في صورة مرفوعة فعليًا من Django Admin وليست default قديم.
    2. إذا في صورة محفوظة من JSON داخل static_image استخدمها.
    3. إذا لا يوجد شيء استخدم الصورة الافتراضية.
    """

    image_value = str(player.image).strip() if player.image else ""

    if image_value and image_value != "players_images/white_gun.jpg":
        return player.image.url

    if player.static_image:
        return player.static_image

    return "/static/images/white_gun.jpg"


def get_fitness_type(fitness):
    if fitness >= 90:
        return "green"
    elif fitness >= 70:
        return "amber"
    return "red"


def format_date_for_card(date_value):
    """
    يحول التاريخ القادم من input type=date:
    2026-03-02 -> 02 Mar 2026
    """
    if not date_value:
        return ""

    try:
        return datetime.strptime(date_value, "%Y-%m-%d").strftime("%d %b %Y")
    except Exception:
        return date_value


def calculate_days_left(return_date):
    """
    يحسب كم يوم باقي للعودة.
    """
    if not return_date:
        return 0

    try:
        return_day = datetime.strptime(return_date, "%Y-%m-%d").date()
        today = datetime.today().date()
        days_left = (return_day - today).days
        return max(days_left, 0)
    except Exception:
        return 0


def get_days_class(days_left):
    if days_left <= 7:
        return "days-urgent"
    elif days_left <= 21:
        return "days-warning"
    return "days-normal"


def get_shared_context():
    players = Player.objects.all()

    players_list = []
    perf_data = []
    tact_data = []
    match_history_data = []
    injury_meta_dict = {}

    for p in players:
        img_url = get_player_image_url(p)

        players_list.append({
            "id": p.id,
            "name": p.name,
            "number": p.number,
            "primary": p.get_position_display(),
            "pos": p.get_position_display(),
            "posGroup": p.position,
            "secondary": p.secondary_position,
            "age": p.age,
            "height": p.height,
            "weight": p.weight,
            "foot": p.preferred_foot,
            "value": f"€{p.market_value}m",
            "valueNum": float(p.market_value),
            "fitness": p.fitness_percentage,
            "fitnessType": get_fitness_type(p.fitness_percentage),
            "medical": p.get_medical_status_display(),
            "medicalType": p.medical_status.lower(),
            "yellowCards": p.yellow_cards,
            "redCards": p.red_cards,
            "img": img_url,
        })

        if p.injury_meta:
            injury_meta_dict[p.name] = p.injury_meta

        perf_data.append({
            "name": p.name,
            "pos": p.get_position_display(),
            "number": p.number,
            "posGroup": p.position,
            "img": img_url,
            "mp": p.matches_played,
            "gs": p.matches_played,
            "min": f"{p.minutes_played:,}",
            "subIn": 0,
            "out": 0,
            "g": p.goals,
            "a": p.assists,
            "xg": 0.0,
            "xa": 0.0,
            "conv": "0%",
            "sh": 0,
            "sot": f"{p.shots_on_target_pct}%",
            "inBox": 0,
            "outBox": 0,
            "fkAcc": "0%",
            "yc": p.yellow_cards,
            "rc": p.red_cards,
            "fc": 0,
            "fs": 0,
            "off": 0,
        })

        tact_data.append({
            "name": p.name,
            "pos": p.get_position_display(),
            "number": p.number,
            "posGroup": p.position,
            "img": img_url,
            "passAcc": f"{p.pass_accuracy}%",
            "keyPasses": p.key_passes,
            "final3rd": 0,
            "longBalls": "0%",
            "throughBalls": 0,
            "tackles": f"{p.tackles_won}%",
            "interceptions": p.interceptions,
            "ballRecov": 0,
            "blockedShots": 0,
            "clearances": 0,
            "totalDuels": "0%",
            "aerial": "0%",
            "ground": "0%",
            "dribbles": "0%",
            "distance": p.distance_covered,
            "hiSprints": p.sprints,
            "topSpeed": p.top_speed,
            "density": 80,
        })

        matches = []

        for m in p.match_history.all():
            matches.append({
                "date": m.date.strftime("%d %b %Y"),
                "opponent": m.opponent,
                "home": True,
                "result": m.result,
                "score": m.score,
                "min": m.minutes_played,
                "g": m.goals,
                "a": m.assists,
                "yc": 1 if m.card == "Yellow" else 0,
                "rc": 1 if m.card == "Red" else 0,
                "rating": m.rating,
                "saves": 0,
                "punches": 0,
                "tackles": 0,
                "clearances": 0,
                "chancesCreated": 0,
                "interceptions": 0,
                "shots": 0,
                "dribbles": 0,
            })

        match_history_data.append({
            "name": p.name,
            "pos": p.get_position_display(),
            "number": p.number,
            "posGroup": p.position,
            "img": img_url,
            "matches": matches,
        })

    return {
        "players_json": json.dumps(players_list),
        "perf_data_json": json.dumps(perf_data),
        "tact_data_json": json.dumps(tact_data),
        "match_history_json": json.dumps(match_history_data),
        "injury_meta_json": json.dumps(injury_meta_dict),
    }


def perform_basic_info(request):
    return render(request, "3-performance/perform5.html", get_shared_context())


def perform_stats(request):
    return render(request, "3-performance/perform5.html", get_shared_context())


def perform_tactical(request):
    return render(request, "3-performance/perform5.html", get_shared_context())


def perform_history(request):
    return render(request, "3-performance/perform5.html", get_shared_context())


def medical_center(request):
    return render(request, "7-medical/medical.html", get_shared_context())


def add_injury(request):
    """
    يستقبل بيانات Modal Record Injury
    ويحفظ تفاصيل الإصابة داخل player.injury_meta.
    يقبل player_id إذا كان رقم id أو اسم اللاعب.
    """

    if request.method != "POST":
        return redirect("medical_center")

    player_id = request.POST.get("player_id")
    injury = request.POST.get("injury")
    severity = request.POST.get("severity")
    injury_date = request.POST.get("injury_date")
    return_date = request.POST.get("return_date")
    status_label = request.POST.get("status")
    notes = request.POST.get("notes")

    if not player_id:
        return redirect("medical_center")

    # مهم: لأن الـ HTML/JS عندك أحيانًا يرسل اسم اللاعب بدل id
    if str(player_id).isdigit():
        player = get_object_or_404(Player, id=player_id)
    else:
        player = get_object_or_404(Player, id=Player.objects.filter(name=player_id).order_by("id").values_list("id", flat=True).first())

    if not injury:
        injury = "Unspecified Injury"

    if not severity:
        severity = "low"

    if not status_label:
        status_label = "Fully Absent"

    severity_map = {
        "low": {
            "cardClass": "inj-card--low",
            "badgeClass": "badge-low",
            "badgeLabel": "Low Severity",
            "progClass": "prog-green",
        },
        "medium": {
            "cardClass": "inj-card--medium",
            "badgeClass": "badge-medium",
            "badgeLabel": "Medium Severity",
            "progClass": "prog-amber",
        },
        "high": {
            "cardClass": "inj-card--high",
            "badgeClass": "badge-high",
            "badgeLabel": "High Severity",
            "progClass": "prog-red",
        },
    }

    status_map = {
        "Fully Absent": {
            "status": "absent",
            "statusClass": "status-absent",
        },
        "Light Training": {
            "status": "light",
            "statusClass": "status-light",
        },
        "Ready to Train": {
            "status": "ready",
            "statusClass": "status-ready",
        },
    }

    severity_data = severity_map.get(severity, severity_map["low"])
    status_data = status_map.get(status_label, status_map["Fully Absent"])

    days_left = calculate_days_left(return_date)

    player.injury_meta = {
        "injury": injury,
        "grade": "",
        "severity": severity,
        "status": status_data["status"],
        "statusLabel": status_label,
        "statusClass": status_data["statusClass"],
        "injuryDate": format_date_for_card(injury_date),
        "returnDate": format_date_for_card(return_date),
        "recovery": 0,
        "daysLeft": days_left,
        "daysClass": get_days_class(days_left),
        "progClass": severity_data["progClass"],
        "cardClass": severity_data["cardClass"],
        "badgeClass": severity_data["badgeClass"],
        "badgeLabel": severity_data["badgeLabel"],
        "notes": notes or "",
    }

    player.medical_status = "injured"
    player.fitness_percentage = 0
    player.save()

    return redirect("medical_center")


def update_injury(request):
    """
    يحفظ تحديثات Recovery Modal داخل player.injury_meta بدل الاكتفاء بتوست في الواجهة.
    """

    if request.method != "POST":
        return redirect("medical_center")

    player_id = request.POST.get("player_id")
    if not player_id:
        return redirect("medical_center")

    if str(player_id).isdigit():
        player = get_object_or_404(Player, id=player_id)
    else:
        player = get_object_or_404(Player, id=Player.objects.filter(name=player_id).order_by("id").values_list("id", flat=True).first())

    meta = player.injury_meta or {}
    status = request.POST.get("upStatus") or meta.get("status") or "absent"
    recovery_raw = request.POST.get("recovery") or meta.get("recovery") or 0
    return_date = request.POST.get("return_date") or ""
    notes = request.POST.get("notes") or meta.get("notes") or ""
    intensity = request.POST.get("intensity") or meta.get("intensity") or "1"

    try:
        recovery = max(0, min(100, int(recovery_raw)))
    except (TypeError, ValueError):
        recovery = 0

    status_map = {
        "absent": ("Fully Absent", "status-absent", "injured"),
        "light": ("Light Training", "status-light", "rehab"),
        "modified": ("Modified Drills", "status-light", "rehab"),
        "ready": ("Ready to Train", "status-ready", "fit"),
    }
    status_label, status_class, medical_status = status_map.get(
        status,
        status_map["absent"],
    )

    if recovery >= 100:
        status = "ready"
        status_label, status_class, medical_status = status_map["ready"]

    if return_date:
        meta["returnDate"] = format_date_for_card(return_date)
        meta["daysLeft"] = calculate_days_left(return_date)
        meta["daysClass"] = get_days_class(meta["daysLeft"])

    meta.update({
        "status": status,
        "statusLabel": status_label,
        "statusClass": status_class,
        "recovery": recovery,
        "notes": notes,
        "intensity": intensity,
    })

    player.injury_meta = meta
    player.medical_status = medical_status
    player.fitness_percentage = recovery if medical_status != "injured" else min(recovery, 69)
    player.save()

    return redirect("medical_center")

import os
import json
from django.conf import settings
from django.shortcuts import render
from .models import Player, Coach

def compare_players(request):
    all_players = Player.objects.select_related(
        'team', 'attributes', 'performance', 'ai_insights'
    ).prefetch_related('injuries').all()

    players_list = []
    
    if all_players.exists():
        for p in all_players:
            attrs = getattr(p, 'attributes', None)
            perf = getattr(p, 'performance', None)
            ai = getattr(p, 'ai_insights', None)
            
            injury = p.injuries.order_by('-last_injury_date').first()
            med_status = injury.status if injury else "Fit"
            days_missed = injury.days_out if injury else 0
            
            fit_color = "green"
            if p.fitness < 75: fit_color = "amber"
            if p.fitness < 50: fit_color = "red"

            img_url = "/static/images/default.jpg"
            if p.img:
                img_str = str(p.img)
                if img_str.startswith('/static/') or img_str.startswith('http'):
                    img_url = img_str
                else:
                    try:
                        img_url = p.img.url
                    except:
                        pass
            player_dict = {
                "id": p.id,
                "name": p.name,
                "short": p.short or p.name,
                "number": p.number,
                "primary": p.primary or p.position,
                "posGroup": p.posGroup or "",
                "nationality": p.nationality,
                "age": p.age,
                "height": p.height or 0,
                "weight": p.weight or 0,
                "foot": p.foot or "-",
                "valueN": p.valueN or 0.0,
                "fitness": p.fitness,
                "fitnessType": fit_color,
                "img": img_url,
                "medical": med_status,
                "medicalType": med_status.lower(),
                "mp": perf.matches_played if perf else 0,
                "gs": perf.starts if perf else 0,
                "min": perf.minutes if perf else 0,
                "g": perf.goals if perf else 0,
                "a": perf.assists if perf else 0,
                "xg": perf.expected_goals_xg if perf else 0.0,
                "xa": perf.expected_assists_xa if perf else 0.0,
                "conv": perf.conversion_rate if perf else 0,
                "sh": perf.total_shots if perf else 0,
                "sot": perf.shots_on_target_pct if perf else 0,
                "inBox": perf.shots_in_box if perf else 0,
                "yc_p": perf.yellow_cards if perf else 0,
                "rc_p": perf.red_cards if perf else 0,
                "fc": perf.fouls_committed if perf else 0,
                "off": perf.offsides if perf else 0,
                "passAcc": perf.pass_accuracy if perf else 0,
                "keyPasses": perf.key_passes_per_90 if perf else 0.0,
                "final3rd": perf.final_third_passes if perf else 0,
                "longBalls": perf.long_ball_pct if perf else 0,
                "throughBalls": perf.through_balls if perf else 0,
                "tackles": perf.tackle_win_pct if perf else 0,
                "interceptions": perf.interceptions_per_90 if perf else 0.0,
                "ballRecov": perf.ball_recoveries_per_90 if perf else 0.0,
                "totalDuels": perf.total_duel_win_pct if perf else 0,
                "aerial": perf.aerial_win_pct if perf else 0,
                "dribbles": perf.dribble_success_pct if perf else 0,
                "distance": perf.distance_covered if perf else 0.0,
                "hiSprints": perf.high_intensity_sprints if perf else 0,
                "topSpeed": perf.top_speed if perf else 0.0,
                "avl": perf.availability_pct if perf else 100,
                "motm": perf.motm_awards if perf else 0,
                "rating": perf.season_rating if perf else 7.0,
                "careerApps": p.career_apps,
                "careerGoals": p.career_goals,
                "trophies": p.trophies,

                "radar": {
                    "Pace": attrs.pace if attrs else 0,
                    "Shooting": attrs.shooting if attrs else 0,
                    "Passing": attrs.passing if attrs else 0,
                    "Dribbling": attrs.dribbling if attrs else 0,
                    "Defending": attrs.defending if attrs else 0,
                    "Physical": attrs.physical if attrs else 0,
                },
                "strengths": ai.strengths if ai else "No data.",
                "weakness": ai.development_areas if ai else "No data.",
                "injuryProneness": ai.risk_level if ai else "Low",
                "injury": days_missed
            }
            players_list.append(player_dict)
        players_json_data = json.dumps(players_list)

    else:
        file_path = os.path.join(settings.BASE_DIR, 'static', 'data', 'players.json')
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                players_json_data = file.read()
        except FileNotFoundError:
            players_json_data = "[]" 
    coach = Coach.objects.first()

    context = {
        'players_json': players_json_data, 
        'coach': coach,
        'coach_title': coach.role if coach else "Head Coach",
        'coach_title_size': "11",
    }
    return render(request, '4-compare/compare.html', context)
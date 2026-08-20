import os
import json
from django.conf import settings
from django.core.management.base import BaseCommand
from compare.models import Player, PlayerAttribute, PerformanceStat, AIInsight, InjuryHistory

class Command(BaseCommand):
    help = 'Load Arsenal players data from JSON file into the Database including all stats'

    def handle(self, *args, **kwargs):
        file_path = os.path.join(settings.BASE_DIR, 'static', 'data', 'players.json')

        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f"File not found at: {file_path}"))
            return

        with open(file_path, 'r', encoding='utf-8') as file:
            players_data = json.load(file)

        for p in players_data:
            player, created = Player.objects.update_or_create(
                name=p.get('name'),
                defaults={
                    'short': p.get('short'),
                    'number': p.get('number'),
                    'primary': p.get('primary'),
                    'posGroup': p.get('posGroup'),
                    'nationality': p.get('nationality'),
                    'age': p.get('age'),
                    'height': p.get('height'),
                    'weight': p.get('weight'),
                    'foot': p.get('foot'),
                    'valueN': p.get('valueN'),
                    'fitness': p.get('fitness', 100),
                    'img': p.get('img'),
                    'career_apps': p.get('careerApps', 0),
                    'career_goals': p.get('careerGoals', 0),
                    'trophies': p.get('trophies', 0),
                }
            )

            radar = p.get('radar', {})
            PlayerAttribute.objects.update_or_create(
                player=player,
                defaults={
                    'pace': radar.get('Pace', 0),
                    'shooting': radar.get('Shooting', 0),
                    'passing': radar.get('Passing', 0),
                    'dribbling': radar.get('Dribbling', 0),
                    'defending': radar.get('Defending', 0),
                    'physical': radar.get('Physical', 0),
                }
            )

            PerformanceStat.objects.update_or_create(
                player=player,
                defaults={
                    'matches_played': p.get('mp', 0),
                    'starts': p.get('gs', 0),
                    'minutes': p.get('min', 0),
                    'goals': p.get('g', 0),
                    'assists': p.get('a', 0),
                    'expected_goals_xg': p.get('xg', 0.0),
                    'expected_assists_xa': p.get('xa', 0.0),
                    'conversion_rate': p.get('conv', 0),
                    'total_shots': p.get('sh', 0),
                    'shots_on_target_pct': p.get('sot', 0),
                    'shots_in_box': p.get('inBox', 0),
                    'yellow_cards': p.get('yc_p', 0),
                    'red_cards': p.get('rc_p', 0),
                    'fouls_committed': p.get('fc', 0),
                    'offsides': p.get('off', 0),
                    'pass_accuracy': p.get('passAcc', 0),
                    'key_passes_per_90': p.get('keyPasses', 0.0),
                    'final_third_passes': p.get('final3rd', 0),
                    'long_ball_pct': p.get('longBalls', 0),
                    'through_balls': p.get('throughBalls', 0),
                    'tackle_win_pct': p.get('tackles', 0),
                    'interceptions_per_90': p.get('interceptions', 0.0),
                    'ball_recoveries_per_90': p.get('ballRecov', 0.0),
                    'total_duel_win_pct': p.get('totalDuels', 0),
                    'aerial_win_pct': p.get('aerial', 0),
                    'dribble_success_pct': p.get('dribbles', 0),
                    'distance_covered': p.get('distance', 0.0),
                    'high_intensity_sprints': p.get('hiSprints', 0),
                    'top_speed': p.get('topSpeed', 0.0),
                    'availability_pct': p.get('avl', 100),
                    'motm_awards': p.get('motm', 0),
                    'season_rating': p.get('rating', 7.0),
                }
            )

            AIInsight.objects.update_or_create(
                player=player,
                defaults={
                    'strengths': p.get('strengths', 'No data'),
                    'development_areas': p.get('weakness', 'No data'),
                    'risk_level': p.get('injuryProneness', 'Low'),
                }
            )
            
            InjuryHistory.objects.update_or_create(
                player=player,
                defaults={
                    'injury_type': 'General Assessment',
                    'status': p.get('medical', 'Fit'),
                    'days_out': p.get('injury', 0),
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created full profile for: {player.name}"))
            else:
                self.stdout.write(self.style.WARNING(f"Updated full profile for: {player.name}"))

        self.stdout.write(self.style.SUCCESS("All players loaded successfully into ALL tables!"))
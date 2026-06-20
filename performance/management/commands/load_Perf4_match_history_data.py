import json
import os
from datetime import datetime
from django.core.management.base import BaseCommand
from django.conf import settings
from performance.models import Player, MatchPerformance

class Command(BaseCommand):
    help = 'Load match history data from static/data/Perf4_match_history_data.json to MatchPerformance Model'

    def handle(self, *args, **kwargs):
        file_path = os.path.join(settings.BASE_DIR, 'static', 'data', 'Perf4_match_history_data.json')
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'الملف غير موجود في: {file_path}'))
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        for item in data:
            if 'name' not in item:
                continue
                
            try:
                player = Player.objects.filter(name=item['name']).first()
                if not player:
                    self.stdout.write(self.style.WARNING(f'اللاعب {item["name"]} غير موجود! تجاوز...'))
                    continue
                matches = item.get('matches', [])
                match_count = 0

                for match in matches:
                    try:
                        match_date = datetime.strptime(match['date'], "%d %b %Y").date()
                    except ValueError:
                        continue 

                    card_status = 'None'
                    if str(match.get('rc', '0')) == '1':
                        card_status = 'Red'
                    elif str(match.get('yc', '0')) == '1':
                        card_status = 'Yellow'

                    mp, created = MatchPerformance.objects.update_or_create(
                        player=player,
                        date=match_date,
                        opponent=match.get('opponent'),
                        defaults={
                            'result': match.get('result', 'D'),
                            'score': match.get('score', '0-0'),
                            'minutes_played': int(match.get('min', 0)),
                            'goals': int(match.get('g', 0)),
                            'assists': int(match.get('a', 0)),
                            'card': card_status,
                            'rating': float(match.get('rating', 0.0)),
                            'distance_km': 0.0,
                        }
                    )

                    if hasattr(mp, 'saves') and 'saves' in match: mp.saves = int(match['saves'])
                    if hasattr(mp, 'punches') and 'punches' in match: mp.punches = int(match['punches'])
                    if hasattr(mp, 'tackles') and 'tackles' in match: mp.tackles = int(match['tackles'])
                    if hasattr(mp, 'clearances') and 'clearances' in match: mp.clearances = int(match['clearances'])
                    if hasattr(mp, 'chancesCreated') and 'chancesCreated' in match: mp.chancesCreated = int(match['chancesCreated'])
                    if hasattr(mp, 'interceptions') and 'interceptions' in match: mp.interceptions = int(match['interceptions'])
                    if hasattr(mp, 'shots') and 'shots' in match: mp.shots = int(match['shots'])
                    if hasattr(mp, 'dribbles') and 'dribbles' in match: mp.dribbles = int(match['dribbles'])
                    
                    mp.save()
                    match_count += 1

                self.stdout.write(self.style.SUCCESS(f'تم إضافة {match_count} مباراة للاعب: {player.name}'))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'حدث خطأ مع {item.get("name")}: {str(e)}'))

        self.stdout.write(self.style.SUCCESS('تم رفع جميع بيانات المباريات بنجاح إلى قاعدة البيانات!'))
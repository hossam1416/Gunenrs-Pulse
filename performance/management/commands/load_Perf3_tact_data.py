import json
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from performance.models import Player 

class Command(BaseCommand):
    help = 'Load tactical data from static/data/Perf3_tact_data.json to Player Model'

    def handle(self, *args, **kwargs):
        file_path = os.path.join(settings.BASE_DIR, 'static', 'data', 'Perf3_tact_data.json')
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'الملف غير موجود في: {file_path}'))
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        def clean_int(val):
            if not val or val == "—": return 0
            cleaned = str(val).replace('%', '').replace(',', '').strip()
            try: return int(float(cleaned))
            except: return 0

        def clean_float(val):
            if not val or val == "—": return 0.0
            cleaned = str(val).replace('%', '').replace(',', '').strip()
            try: return float(cleaned)
            except: return 0.0

        for item in data:
            if 'name' not in item:
                continue
            try:
                player = Player.objects.filter(name=item['name']).first()
                
                if not player:
                    self.stdout.write(self.style.WARNING(f'اللاعب {item["name"]} مش موجود بالداتابيز!'))
                    continue

                if 'passAcc' in item: player.pass_accuracy = clean_float(item['passAcc'])
                if 'keyPasses' in item: player.key_passes = clean_int(item['keyPasses'])
                if 'interceptions' in item: player.interceptions = clean_int(item['interceptions'])
                if 'tackles' in item: player.tackles_won = clean_int(item['tackles'])
                if 'topSpeed' in item: player.top_speed = clean_float(item['topSpeed'])
                if 'distance' in item: player.distance_covered = clean_float(item['distance'])
                if 'hiSprints' in item: player.sprints = clean_int(item['hiSprints'])
                
                player.save()
                self.stdout.write(self.style.SUCCESS(f'تم تحديث التكتيك للاعب: {player.name}'))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'حدث خطأ مع {item.get("name")}: {str(e)}'))

        self.stdout.write(self.style.SUCCESS('تم رفع جميع البيانات التكتيكية بنجاح إلى قاعدة البيانات!'))
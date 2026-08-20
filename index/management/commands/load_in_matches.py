import os
import json
from django.core.management.base import BaseCommand
from django.conf import settings
from index.models import DashboardData

class Command(BaseCommand):
    help = 'Load match data from in_matches.json into DashboardData Model'

    def handle(self, *args, **kwargs):
        # مسار الملف (تأكد إنه موجود جوا static/data)
        file_path = os.path.join(settings.BASE_DIR, 'static', 'data', 'in_matches.json')
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'❌ الملف غير موجود في: {file_path}'))
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # بنعمل إنشاء أو تحديث لبيانات المباريات
        dashboard_matches, created = DashboardData.objects.get_or_create(
            name="Matches Data",
            defaults={'data': data}
        )
        
        # إذا كان موجود من قبل، بنحدثه
        if not created:
            dashboard_matches.data = data
            dashboard_matches.save()

        self.stdout.write(self.style.SUCCESS('🎉 تم رفع بيانات in_matches.json بنجاح 100%!'))
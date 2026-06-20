import os
import json
from django.core.management.base import BaseCommand
from django.conf import settings
from index.models import DashboardData

class Command(BaseCommand):
    help = 'Load dashboard data from in_data.json into DashboardData Model'

    def handle(self, *args, **kwargs):
        # مسار الملف (تأكد إنه موجود جوا static/data)
        file_path = os.path.join(settings.BASE_DIR, 'static', 'data', 'in_data.json')
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'❌ الملف غير موجود في: {file_path}'))
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # بنعمل إنشاء أو تحديث للبيانات
        dashboard, created = DashboardData.objects.get_or_create(
            name="Home Dashboard",
            defaults={'data': data}
        )
        
        # إذا كان موجود من قبل، بنعمله تحديث بالبيانات الجديدة
        if not created:
            dashboard.data = data
            dashboard.save()

        self.stdout.write(self.style.SUCCESS('🎉 تم رفع بيانات in_data.json بنجاح 100%!'))
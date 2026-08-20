import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from index.models import DashboardData


class Command(BaseCommand):
    help = "Load player dashboard JSON data into DashboardData table."

    def handle(self, *args, **options):
        file_path = Path(settings.BASE_DIR) / "static" / "data" / "player_dashboard.json"

        if not file_path.exists():
            self.stderr.write(self.style.ERROR(f"File not found: {file_path}"))
            return

        with open(file_path, "r", encoding="utf-8") as file:
            data = json.load(file)

        obj, created = DashboardData.objects.update_or_create(
            name="Player Dashboard",
            defaults={"data": data},
        )

        if created:
            self.stdout.write(self.style.SUCCESS("Player Dashboard created successfully."))
        else:
            self.stdout.write(self.style.SUCCESS("Player Dashboard updated successfully."))
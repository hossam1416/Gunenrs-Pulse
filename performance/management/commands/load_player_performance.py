import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from performance.models import PlayerPerformanceData


class Command(BaseCommand):
    help = "Load player performance data from static/data/player_performance.json"

    def handle(self, *args, **options):
        file_path = (
            Path(settings.BASE_DIR)
            / "static"
            / "data"
            / "player_performance.json"
        )

        if not file_path.exists():
            self.stderr.write(
                self.style.ERROR(f"File not found: {file_path}")
            )
            return

        with open(file_path, "r", encoding="utf-8") as file:
            data = json.load(file)

        if not isinstance(data, dict):
            self.stderr.write(
                self.style.ERROR("JSON root must be an object.")
            )
            return

        if "matches" not in data:
            self.stderr.write(
                self.style.ERROR("JSON file must contain a 'matches' key.")
            )
            return

        obj, created = PlayerPerformanceData.objects.update_or_create(
            name="Player Performance",
            defaults={
                "data": data,
            },
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS("Player Performance data created successfully.")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS("Player Performance data updated successfully.")
            )
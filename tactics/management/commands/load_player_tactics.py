import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from tactics.models import PlayerTacticsData


class Command(BaseCommand):
    help = "Load player tactics data from static/data/player_tactics.json"

    def handle(self, *args, **options):
        file_path = (
            Path(settings.BASE_DIR)
            / "static"
            / "data"
            / "player_tactics.json"
        )

        if not file_path.exists():
            self.stderr.write(
                self.style.ERROR(f"File not found: {file_path}")
            )
            return

        with open(file_path, "r", encoding="utf-8") as file:
            data = json.load(file)

        required_keys = [
            "rolesData",
            "formations",
            "players",
            "sptRoles",
            "sptDefaults",
            "currentTactic",
            "currentPlayerShort",
        ]

        missing_keys = [key for key in required_keys if key not in data]

        if missing_keys:
            self.stderr.write(
                self.style.ERROR(
                    f"Missing keys in JSON: {', '.join(missing_keys)}"
                )
            )
            return

        obj, created = PlayerTacticsData.objects.update_or_create(
            name="Player Tactics",
            defaults={
                "data": data,
            },
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS("Player Tactics data created successfully.")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS("Player Tactics data updated successfully.")
            )
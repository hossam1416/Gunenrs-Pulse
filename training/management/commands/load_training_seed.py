import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from training.models import Player, TrainingSection, TrainingDrill


class Command(BaseCommand):
    help = "Load training players, sections, and drills from static/data/training_seed.json"

    def handle(self, *args, **options):
        json_path = Path(settings.BASE_DIR) / "static" / "data" / "training_seed.json"

        if not json_path.exists():
            self.stderr.write(self.style.ERROR(f"File not found: {json_path}"))
            return

        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        players = data.get("players", [])
        sections = data.get("sections", [])

        players_count = 0
        sections_count = 0
        drills_count = 0

        for item in players:
            player_id = item.get("id")
            if not player_id:
                continue

            Player.objects.update_or_create(
                id=player_id,
                defaults={
                    "name": item.get("name", ""),
                    "short": item.get("short", ""),
                    "number": item.get("number"),
                    "primary": item.get("pos", ""),
                    "posGroup": item.get("posGroup", ""),
                    "fitness": item.get("fitness") or 100,
                    "img": item.get("img", ""),
                },
            )
            players_count += 1

        for section_item in sections:
            section_id = section_item.get("id")
            if not section_id:
                continue

            section, _ = TrainingSection.objects.update_or_create(
                section_id=section_id,
                defaults={
                    "name": section_item.get("name", ""),
                    "icon": section_item.get("icon", ""),
                    "description": section_item.get("description", ""),
                },
            )
            sections_count += 1

            for drill_item in section_item.get("drills", []):
                drill_id = drill_item.get("id")
                if not drill_id:
                    continue

                attrs = drill_item.get("attrs", [])
                if isinstance(attrs, list):
                    attrs = ", ".join(attrs)

                TrainingDrill.objects.update_or_create(
                    drill_id=drill_id,
                    defaults={
                        "section": section,
                        "name": drill_item.get("name", ""),
                        "short_name": drill_item.get("shortName", ""),
                        "focus_label": drill_item.get("focusLabel", ""),
                        "intensity": drill_item.get("intensity", ""),
                        "duration": drill_item.get("duration") or 0,
                        "attrs": attrs,
                        "video": drill_item.get("video", ""),
                        "description": drill_item.get("description", ""),
                    },
                )
                drills_count += 1

        self.stdout.write(self.style.SUCCESS("Training seed loaded successfully."))
        self.stdout.write(f"Players: {players_count}")
        self.stdout.write(f"Sections: {sections_count}")
        self.stdout.write(f"Drills: {drills_count}")

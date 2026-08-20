import json
import re
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from performance.models import MatchPerformance, Player


FIELD_MAP = {
    "opponent": "opponent",
    "home": "home",
    "result": "result",
    "score": "score",
    "min": "minutes_played",
    "goals": "goals",
    "assists": "assists",
    "rating": "rating",
    "shots": "shots",
    "keyPass": "chances_created",
}


class Command(BaseCommand):
    help = (
        "Import/validate the original MATCH_DATA array from "
        "static/data/old_sources/old_player_perform_source.js."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--player",
            default="Bukayo Saka",
            help="Player name to attach the old MATCH_DATA records to.",
        )
        parser.add_argument(
            "--source",
            default="static/data/old_sources/old_player_perform_source.js",
            help="Path to the old JavaScript source file.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Compare without writing changes.",
        )

    def handle(self, *args, **options):
        source_path = Path(settings.BASE_DIR) / options["source"]
        player_name = options["player"]

        if not source_path.exists():
            raise CommandError(f"Source file not found: {source_path}")

        try:
            player = Player.objects.get(name=player_name)
        except Player.DoesNotExist as exc:
            raise CommandError(f"Player not found: {player_name}") from exc

        source_matches = self.extract_match_data(source_path)
        before_count = MatchPerformance.objects.filter(player=player).count()

        created_count = 0
        updated_count = 0
        unchanged_count = 0

        with transaction.atomic():
            for source_match in source_matches:
                match_date = datetime.strptime(
                    source_match["date"],
                    "%d/%m/%y",
                ).date()
                defaults = self.build_defaults(source_match)

                existing = MatchPerformance.objects.filter(
                    player=player,
                    date=match_date,
                    opponent=defaults["opponent"],
                ).first()

                if existing is None:
                    created_count += 1
                    if not options["dry_run"]:
                        MatchPerformance.objects.create(
                            player=player,
                            date=match_date,
                            **defaults,
                        )
                    continue

                changed_fields = {
                    field: value
                    for field, value in defaults.items()
                    if getattr(existing, field) != value
                }

                if changed_fields:
                    updated_count += 1
                    if not options["dry_run"]:
                        for field, value in changed_fields.items():
                            setattr(existing, field, value)
                        existing.save(update_fields=list(changed_fields))
                else:
                    unchanged_count += 1

            if options["dry_run"]:
                transaction.set_rollback(True)

        after_count = MatchPerformance.objects.filter(player=player).count()
        missing_after = self.find_missing_source_records(player, source_matches)
        monthly_ga = self.monthly_goals_assists_nonzero(player)

        self.stdout.write(f"player={player.name}")
        self.stdout.write(f"source_records={len(source_matches)}")
        self.stdout.write(f"records_before={before_count}")
        self.stdout.write(f"records_after={after_count}")
        self.stdout.write(f"created={created_count}")
        self.stdout.write(f"updated={updated_count}")
        self.stdout.write(f"unchanged={unchanged_count}")
        self.stdout.write(f"missing_after={len(missing_after)}")
        self.stdout.write(
            "monthly_goals_assists_nonzero="
            f"{'yes' if monthly_ga else 'no'}"
        )

        if missing_after:
            for match in missing_after:
                self.stdout.write(
                    self.style.WARNING(
                        f"missing {match['date']} {match['opponent']}"
                    )
                )

    def extract_match_data(self, source_path):
        source = source_path.read_text(encoding="utf-8")
        marker = "const MATCH_DATA ="
        marker_index = source.find(marker)

        if marker_index == -1:
            raise CommandError("MATCH_DATA declaration was not found.")

        array_start = source.find("[", marker_index)
        if array_start == -1:
            raise CommandError("MATCH_DATA array start was not found.")

        depth = 0
        in_string = False
        escape = False
        array_end = None

        for index in range(array_start, len(source)):
            char = source[index]

            if in_string:
                if escape:
                    escape = False
                elif char == "\\":
                    escape = True
                elif char == '"':
                    in_string = False
                continue

            if char == '"':
                in_string = True
            elif char == "[":
                depth += 1
            elif char == "]":
                depth -= 1
                if depth == 0:
                    array_end = index + 1
                    break

        if array_end is None:
            raise CommandError("MATCH_DATA array end was not found.")

        js_array = self.strip_line_comments(source[array_start:array_end])
        json_array = re.sub(
            r"(?m)(\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:",
            r'\1"\2":',
            js_array,
        )
        json_array = re.sub(r",(\s*[}\]])", r"\1", json_array)

        try:
            data = json.loads(json_array)
        except json.JSONDecodeError as exc:
            raise CommandError(f"Unable to parse MATCH_DATA: {exc}") from exc

        if not isinstance(data, list):
            raise CommandError("MATCH_DATA must be an array.")

        return data

    def strip_line_comments(self, value):
        output = []
        index = 0
        in_string = False
        escape = False

        while index < len(value):
            char = value[index]
            next_char = value[index + 1] if index + 1 < len(value) else ""

            if in_string:
                output.append(char)
                if escape:
                    escape = False
                elif char == "\\":
                    escape = True
                elif char == "\"":
                    in_string = False
                index += 1
                continue

            if char == "\"":
                in_string = True
                output.append(char)
                index += 1
                continue

            if char == "/" and next_char == "/":
                while index < len(value) and value[index] != "\n":
                    index += 1
                continue

            output.append(char)
            index += 1

        return "".join(output)

    def build_defaults(self, source_match):
        defaults = {
            "competition": source_match.get("compLabel")
            or source_match.get("comp")
            or "",
        }

        for source_field, model_field in FIELD_MAP.items():
            defaults[model_field] = source_match.get(source_field)

        defaults["minutes_played"] = int(defaults["minutes_played"] or 0)
        defaults["goals"] = int(defaults["goals"] or 0)
        defaults["assists"] = int(defaults["assists"] or 0)
        defaults["shots"] = int(defaults["shots"] or 0)
        defaults["chances_created"] = int(defaults["chances_created"] or 0)
        defaults["rating"] = float(defaults["rating"] or 0)

        return defaults

    def find_missing_source_records(self, player, source_matches):
        missing = []

        for source_match in source_matches:
            match_date = datetime.strptime(
                source_match["date"],
                "%d/%m/%y",
            ).date()

            exists = MatchPerformance.objects.filter(
                player=player,
                date=match_date,
                opponent=source_match["opponent"],
            ).exists()

            if not exists:
                missing.append(source_match)

        return missing

    def monthly_goals_assists_nonzero(self, player):
        return MatchPerformance.objects.filter(
            player=player,
        ).filter(
            goals__gt=0,
        ).exists() or MatchPerformance.objects.filter(
            player=player,
            assists__gt=0,
        ).exists()

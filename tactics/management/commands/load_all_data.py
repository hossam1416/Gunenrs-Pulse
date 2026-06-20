import os
import json
from django.conf import settings
from django.core.management.base import BaseCommand
from tactics.models import Player 

class Command(BaseCommand):
    help = 'Load Players data from players_data.json into the Database'

    def handle(self, *args, **kwargs):
        data_dir = os.path.join(settings.BASE_DIR, 'static', 'data')
        players_file = os.path.join(data_dir, 'players_data.json')

        if not os.path.exists(players_file):
            self.stdout.write(self.style.ERROR(f" File not found at: {players_file}"))
            return
        with open(players_file, 'r', encoding='utf-8') as file:
            players_data = json.load(file)

        for p in players_data:
            player, created = Player.objects.update_or_create(
                name=p.get('name'),
                defaults={
                    'short': p.get('short'),
                    'number': p.get('number'),
                    'primary': p.get('primary'),
                    'posGroup': p.get('posGroup'),
                    'img': p.get('img'),
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created player: {player.name}"))
            else:
                self.stdout.write(self.style.SUCCESS(f"Updated player: {player.name}"))

        self.stdout.write(self.style.SUCCESS("\n All players loaded successfully!"))
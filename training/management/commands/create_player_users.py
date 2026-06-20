import re

from django.contrib.auth.models import Group, User
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from training.models import Player


DEFAULT_PASSWORD = "12345678"
PLAYER_GROUP_NAME = "Players"


def username_for_player(player):
    name = (player.name or "").translate(
        str.maketrans({
            "Ø": "O",
            "ø": "o",
            "Đ": "D",
            "đ": "d",
        })
    )
    base = slugify(name, allow_unicode=False).replace("-", "_")
    base = re.sub(r"_+", "_", base).strip("_")
    if not base:
        base = f"player_{player.id}"
    elif not base.startswith("player_"):
        base = f"player_{base}"
    return base.lower()


def unique_username(base, player):
    username = base
    suffix = 2

    while True:
        user = User.objects.filter(username=username).first()
        if not user:
            return username, None

        linked_player = getattr(user, "player", None)
        if linked_player and linked_player.id == player.id:
            return username, user

        if not linked_player and not Player.objects.filter(user=user).exclude(id=player.id).exists():
            return username, user

        username = f"{base}_{suffix}"
        suffix += 1


class Command(BaseCommand):
    help = "Create and link one Django User account for every training Player."

    def handle(self, *args, **options):
        group, _ = Group.objects.get_or_create(name=PLAYER_GROUP_NAME)
        created_count = 0
        linked_count = 0
        existing_count = 0

        for player in Player.objects.all().order_by("id"):
            base_username = username_for_player(player)

            if player.user_id:
                user = player.user
                if user.username != base_username:
                    username, reusable_user = unique_username(base_username, player)
                    if reusable_user and reusable_user.id != user.id:
                        username = f"{base_username}_{player.id}"
                    user.username = username
                action = "existing-linked"
                existing_count += 1
            else:
                username, user = unique_username(base_username, player)
                if user:
                    action = "linked-existing-user"
                    linked_count += 1
                else:
                    user = User(username=username)
                    action = "created"
                    created_count += 1

                player.user = user

            user.first_name = (player.short or player.name or "").strip()[:150]
            user.is_active = True
            user.set_password(DEFAULT_PASSWORD)
            user.save()
            user.groups.add(group)

            if player.user_id != user.id:
                player.user = user
            player.save(update_fields=["user"])

            self.stdout.write(
                f"{action}: player_id={player.id} player='{player.name}' username='{user.username}'"
            )

        self.stdout.write(
            self.style.SUCCESS(
                "Done. "
                f"created={created_count}, linked_existing={linked_count}, "
                f"already_linked={existing_count}, password='{DEFAULT_PASSWORD}'"
            )
        )

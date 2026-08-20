from django.contrib import admin
from .models import Team, Coach, Player, PlayerAttribute, PerformanceStat, InjuryHistory, AIInsight

@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ('name', 'number', 'primary', 'nationality', 'age')
    search_fields = ('name', 'number')
    list_filter = ('primary', 'nationality', 'posGroup')

admin.site.register(Team)
admin.site.register(Coach)
admin.site.register(PlayerAttribute)
admin.site.register(PerformanceStat)
admin.site.register(InjuryHistory)
admin.site.register(AIInsight)

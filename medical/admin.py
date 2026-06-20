from django.contrib import admin
from .models import Player, MatchPerformance

# إعداد عرض سجل المباريات كجزء مدمج داخل صفحة اللاعب (Inline)
class MatchPerformanceInline(admin.TabularInline):
    model = MatchPerformance
    extra = 1
    fields = ['date', 'opponent', 'result', 'score', 'rating']

@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    # 1. الأعمدة التي تظهر في قائمة اللاعبين الخارجية
    list_display = ('number', 'name', 'position', 'medical_status', 'fitness_percentage', 'market_value')
    
    # 2. إمكانية البحث والفلاتر
    search_fields = ('name', 'number')
    list_filter = ('position', 'medical_status', 'preferred_foot')
    
    # 3. تقسيم الحقول داخل صفحة تعديل اللاعب إلى مجموعات (مرتبة لتطابق تصميمك)
    fieldsets = (
        ('Basic Information (Identity & Physical)', {
            'fields': (('name', 'number'), ('position', 'secondary_position'), ('birth_date', 'preferred_foot'), ('height', 'weight'))
        }),
        ('Contract & Value', {
            'fields': (('contract_start', 'contract_expiry'), 'market_value')
        }),
        ('Medical Center & Fitness', {
            'fields': (('medical_status', 'fitness_percentage'), 'injury_meta'),
            'description': "إدارة تفاصيل الإصابة واللياقة البدنية (هذه الحقول تتحكم بصفحة الـ Medical Center)"
        }),
        ('Season Totals (Perform-2)', {
            'fields': (('matches_played', 'minutes_played'), ('goals', 'assists'), ('yellow_cards', 'red_cards'), 'shots_on_target_pct')
        }),
        ('Tactical & Physical (Perform-3)', {
            'fields': (('pass_accuracy', 'key_passes'), ('interceptions', 'tackles_won'), ('top_speed', 'distance_covered', 'sprints'))
        }),
    )

    # 4. ربط سجل المباريات ليكون قابلاً للتعديل من داخل صفحة اللاعب
    inlines = [MatchPerformanceInline]

@admin.register(MatchPerformance)
class MatchPerformanceAdmin(admin.ModelAdmin):
    list_display = ('player', 'date', 'opponent', 'result', 'rating')
    list_filter = ('result', 'competition', 'date')
    search_fields = ('player__name', 'opponent')
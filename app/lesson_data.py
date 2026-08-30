"""
Bu fayl frontend-dəki app.js-in LESSON_DATA massivinin server tərəfindəki
güzgüsüdür (mirror). QƏSDƏN təkrarlanır, çünki server client-ə HEÇ VAXT
etibar etməməlidir: əgər XP miqdarını client göndərsəydi
(məs. POST /lessons/l1/complete {"xp": 999999}), istənilən istifadəçi
DevTools-dan sorğunu dəyişib özünə istənilən qədər XP yaza bilərdi.
Ona görə "bu lesson nə qədər XP verir" sualının CAVABI yalnız burada,
serverdə yaşayır.

QEYD: Əgər frontend-də LESSON_DATA dəyişsə, bu faylı da sinxronlaşdırmaq
lazımdır. Böyüsə, bunu ortaq bir JSON fayldan hər iki tərəf oxuya bilər.
"""

LESSON_DATA = [
    {"id": "l1", "title": "Morning Breathing", "emoji": "🌅", "xp": 10,
     "desc": "Begin your day with 5 minutes of deep diaphragmatic breathing. Inhale for 4 counts, hold for 4, exhale for 6. This activates your parasympathetic nervous system.",
     "taskType": "breathe", "type": "lesson", "duration": 300},

    {"id": "l2", "title": "Mood Check-In", "emoji": "💭", "xp": 12,
     "desc": "How are you feeling right now? Naming your emotions is the first and most powerful step toward understanding them. There are no wrong answers.",
     "taskType": "mood", "type": "lesson"},

    {"id": "l3", "title": "First Milestone!", "emoji": "🏅", "xp": 15,
     "desc": "You completed your first set of daily wellness tasks. Every expert was once a beginner. Your journey has officially begun!",
     "taskType": "celebrate", "type": "checkpoint"},

    {"id": "l4", "title": "Gratitude Journal", "emoji": "📝", "xp": 14,
     "desc": "Write down 3 things you are grateful for today — big or small. Research shows daily gratitude practice physically rewires the brain toward positivity over time.",
     "taskType": "journal", "type": "lesson",
     "prompt": "What are 3 things you are grateful for today?"},

    {"id": "l5", "title": "Mindful Walk", "emoji": "🚶", "xp": 16,
     "desc": "Take a 10-minute walk outside. Focus completely on your surroundings — what you see, hear, smell, and feel underfoot. No phone, no music.",
     "taskType": "timer", "type": "lesson", "duration": 600},

    {"id": "l6", "title": "Weekly Challenge", "emoji": "⚡", "xp": 30,
     "desc": "Complete a 20-minute mindfulness session. Sit comfortably, close your eyes, and gently return your attention to your breath each time your mind wanders.",
     "taskType": "timer", "type": "boss", "duration": 1200},

    {"id": "l7", "title": "Connect", "emoji": "💬", "xp": 12,
     "desc": "Reach out to one person you care about — a friend, family member, or someone you haven't spoken to in a while. A simple \"thinking of you\" goes a long way.",
     "taskType": "confirm", "type": "lesson"},

    {"id": "l8", "title": "Body Scan", "emoji": "🧘", "xp": 18,
     "desc": "Lie down comfortably. Slowly move your attention from your toes to the top of your head, pausing at each area and consciously releasing any tension you find there.",
     "taskType": "breathe", "type": "lesson", "duration": 480},

    {"id": "l9", "title": "Hydration Check", "emoji": "💧", "xp": 20,
     "desc": "Physical and mental health are deeply connected. Have you had 8 glasses of water today? Even mild dehydration worsens mood, focus, and anxiety.",
     "taskType": "confirm", "type": "lesson"},

    {"id": "l10", "title": "Week Complete!", "emoji": "🌟", "xp": 20,
     "desc": "You finished a full week of daily wellness tasks. That is genuinely remarkable. Most people give up within 3 days. You didn't. Celebrate yourself!",
     "taskType": "celebrate", "type": "checkpoint"},

    {"id": "l11", "title": "Sleep Routine", "emoji": "🌙", "xp": 22,
     "desc": "Set a consistent bedtime tonight. Turn off all screens 30 minutes before sleep. Poor sleep is one of the strongest predictors of anxiety and depression.",
     "taskType": "confirm", "type": "lesson"},

    {"id": "l12", "title": "Affirmations", "emoji": "💪", "xp": 24,
     "desc": "Stand in front of a mirror and repeat 5 positive affirmations aloud with conviction. You deserve the same kindness you freely give to others.",
     "taskType": "journal", "type": "lesson",
     "prompt": "Write 5 positive affirmations about yourself:"},

    {"id": "l13", "title": "Month Milestone!", "emoji": "🏆", "xp": 50,
     "desc": "One full month of daily mental wellness practice. You have built something truly remarkable. You are a Dolphy champion — and proof that small daily steps lead to real change.",
     "taskType": "celebrate", "type": "boss"},
]

LESSON_BY_ID = {lesson["id"]: lesson for lesson in LESSON_DATA}

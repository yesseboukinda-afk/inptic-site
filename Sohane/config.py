# ============================================================
#                    CONFIGURATION DE NOVA 3.0
# ============================================================

# Nom de l'assistant
NOM_NOVA = "NOVA"


# ============================================================
#                    INTELLIGENCE ARTIFICIELLE
# ============================================================

# Modèle utilisé par Ollama
MODELE_OLLAMA = "llama3.2"


# ============================================================
#                    RECONNAISSANCE VOCALE
# ============================================================

# Emplacement du modèle vocal français Vosk
VOSK_MODEL_PATH = "modele_vosk/vosk-model-small-fr-0.22"

# Numéro du microphone utilisé par NOVA
MICROPHONE_DEVICE = 1

# Fréquence audio
SAMPLE_RATE = 16000


# ============================================================
#                         MÉMOIRE
# ============================================================

# Fichier utilisé pour enregistrer les souvenirs
MEMOIRE_FILE = "memoire.json"


# ============================================================
#                    PERSONNALITÉ DE NOVA
# ============================================================

SYSTEM_PROMPT = """
Tu es NOVA, un frangin virtuel intelligent.

Ton blaze est NOVA.
L'utilisateur n'est pas NOVA.
Ne l'appelle jamais NOVA.

Réponds naturellement en français.
Sois utile, clair et naturel.

Réponds de manière concise quand une réponse courte suffit.

Tu dois :
- comprendre le contexte de la conversation ;
- répondre précisément aux questions ;
- expliquer simplement les choses difficiles ;
- reconnaître quand tu ne connais pas une information ;
- éviter les réponses inutilement longues.

Tu n'es pas humain.
Tu es un assistant IA fonctionnant localement avec Ollama.
"""
# ============================================================
#                         NOVA 3.0
# ============================================================

import json
import queue
import sys
import time

import pyttsx3
import sounddevice as sd
import vosk

from vosk import KaldiRecognizer

from config import (
    NOM_NOVA,
    SYSTEM_PROMPT,
    VOSK_MODEL_PATH,
    MICROPHONE_DEVICE,
    SAMPLE_RATE
)

from cerveau import CerveauNOVA

from memoire import (
    charger_memoire,
    ajouter_souvenir,
    obtenir_souvenirs
)

import actions

import web


# ============================================================
#                         VOIX
# ============================================================

moteur = pyttsx3.init()


def parler(texte):

    print(f"\n{NOM_NOVA} : {texte}")

    try:

        moteur.say(texte)
        moteur.runAndWait()

    except Exception as erreur:

        print("Erreur voix :", erreur)


# ============================================================
#                  RECONNAISSANCE VOCALE
# ============================================================

print("🧠 Chargement du modèle vocal français...")

try:

    modele_vosk = vosk.Model(
        VOSK_MODEL_PATH
    )

    print("✅ Modèle vocal français chargé.")

except Exception as erreur:

    print(
        "❌ Impossible de charger le modèle Vosk."
    )

    print("Erreur :", erreur)

    sys.exit()


audio_queue = queue.Queue()


def callback(indata, frames, time_info, status):

    if status:

        print(status)

    audio_queue.put(
        bytes(indata)
    )


def ecouter():

    recognizer = KaldiRecognizer(
        modele_vosk,
        SAMPLE_RATE
    )

    audio_queue.queue.clear()

    print("\n🎤 NOVA écoute...")
    print("🎤 Parle maintenant...")

    try:

        with sd.RawInputStream(
            samplerate=SAMPLE_RATE,
            blocksize=8000,
            device=MICROPHONE_DEVICE,
            dtype="int16",
            channels=1,
            callback=callback
        ):

            debut = time.time()

            while True:

                if time.time() - debut > 10:

                    print(
                        "⏱️ Temps d'écoute terminé."
                    )

                    return ""

                data = audio_queue.get()

                if recognizer.AcceptWaveform(data):

                    resultat = json.loads(
                        recognizer.Result()
                    )

                    texte = resultat.get(
                        "text",
                        ""
                    ).strip()

                    if texte:

                        print(
                            f"🔎 Vous : {texte}"
                        )

                        return texte

    except Exception as erreur:

        print(
            "❌ Erreur microphone :",
            erreur
        )

        return ""


# ============================================================
#                         MÉMOIRE
# ============================================================

memoire = charger_memoire()


def afficher_memoire():

    souvenirs = obtenir_souvenirs(
        memoire
    )

    if not souvenirs:

        parler(
            "Je n'ai encore aucun souvenir enregistré."
        )

        return

    print("\n🧠 Souvenirs de NOVA :")

    for numero, souvenir in enumerate(
        souvenirs,
        start=1
    ):

        print(
            f"{numero}. {souvenir}"
        )

    parler(
        f"J'ai actuellement {len(souvenirs)} souvenir(s) en mémoire."
    )


# ============================================================
#                      TRAITEMENT COMMANDES
# ============================================================

def traiter_commande(texte):

    texte = texte.lower().strip()

    # --------------------------------------------------------
    # QUITTER
    # --------------------------------------------------------

    commandes_quitter = [
        "quitter",
        "au revoir",
        "arrête toi",
        "arrête",
        "stop nova"
    ]

    if texte in commandes_quitter:

        parler(
            "D'accord. À bientôt."
        )

        return False


    # --------------------------------------------------------
    # MÉMOIRE
    # --------------------------------------------------------

    if texte.startswith(
        "souviens toi que"
    ):

        souvenir = texte[
            len("souviens toi que"):
        ].strip()

        if souvenir:

            ajouter_souvenir(
                memoire,
                souvenir
            )

            parler(
                "D'accord, je vais m'en souvenir."
            )

        else:

            parler(
                "Dis-moi précisément ce que tu veux que je retienne."
            )

        return True


    if (
        "qu'est-ce que tu te rappelles" in texte
        or "que te rappelles-tu" in texte
        or "montre ma mémoire" in texte
        or "montre tes souvenirs" in texte
    ):

        afficher_memoire()

        return True


    # --------------------------------------------------------
    # OUVRIR CHROME
    # --------------------------------------------------------

    if (
        "ouvre chrome" in texte
        or "ouvre google chrome" in texte
    ):

        parler(
            actions.ouvrir_chrome()
        )

        return True


    # --------------------------------------------------------
    # OUVRIR YOUTUBE
    # --------------------------------------------------------

    if "ouvre youtube" in texte:

        parler(
            actions.ouvrir_youtube()
        )

        return True


    # --------------------------------------------------------
    # OUVRIR GOOGLE
    # --------------------------------------------------------

    if "ouvre google" in texte:

        parler(
            actions.ouvrir_google()
        )

        return True


    # --------------------------------------------------------
    # OUVRIR VS CODE
    # --------------------------------------------------------

    if (
        "ouvre vscode" in texte
        or "ouvre vs code" in texte
        or "ouvre visual studio code" in texte
    ):

        parler(
            actions.ouvrir_vscode()
        )

        return True


    # --------------------------------------------------------
    # RECHERCHE INTERNET
    # --------------------------------------------------------

    mots_recherche = [
        "cherche",
        "recherche sur internet",
        "recherche sur le web",
        "cherche sur internet"
    ]

    for mot in mots_recherche:

        if texte.startswith(mot):

            requete = texte[
                len(mot):
            ].strip()

            if not requete:

                parler(
                    "Que veux-tu que je recherche ?"
                )

                return True

            parler(
                f"Je recherche {requete}."
            )

            resultats = web.rechercher_sur_internet(
                requete
            )

            web.afficher_resultats(
                resultats
            )

            return True


    # --------------------------------------------------------
    # INTELLIGENCE ARTIFICIELLE
    # --------------------------------------------------------

    reponse = cerveau.repondre(
        texte
    )

    parler(
        reponse
    )

    return True


# ============================================================
#                         CERVEAU
# ============================================================

cerveau = CerveauNOVA(
    SYSTEM_PROMPT
)


# ============================================================
#                       DÉMARRAGE
# ============================================================

print()
print("==============================")
print("          🤖 NOVA 3.0")
print("==============================")
print()
print("NOVA est prête.")
print(
    "Parle à NOVA pour lui poser une question."
)
print(
    "Dis 'quitter' pour arrêter."
)


# ============================================================
#                         BOUCLE
# ============================================================

while True:

    texte = ecouter()

    if not texte:

        continue

    continuer = traiter_commande(
        texte
    )

    if not continuer:

        break


print()
print("==============================")
print("       NOVA est arrêtée.")
print("==============================")
# ============================================================
#                    MÉMOIRE DE NOVA 3.0
# ============================================================

import os
import json

from config import MEMOIRE_FILE


def charger_memoire():

    if not os.path.exists(MEMOIRE_FILE):

        return {
            "souvenirs": []
        }

    try:

        with open(
            MEMOIRE_FILE,
            "r",
            encoding="utf-8"
        ) as fichier:

            return json.load(fichier)

    except Exception as erreur:

        print(
            "Erreur chargement mémoire :",
            erreur
        )

        return {
            "souvenirs": []
        }


def sauvegarder_memoire(memoire):

    try:

        with open(
            MEMOIRE_FILE,
            "w",
            encoding="utf-8"
        ) as fichier:

            json.dump(
                memoire,
                fichier,
                ensure_ascii=False,
                indent=4
            )

    except Exception as erreur:

        print(
            "Erreur sauvegarde mémoire :",
            erreur
        )


def ajouter_souvenir(memoire, souvenir):

    souvenir = souvenir.strip()

    if not souvenir:
        return False

    memoire["souvenirs"].append(souvenir)

    sauvegarder_memoire(memoire)

    return True


def obtenir_souvenirs(memoire):

    return memoire.get(
        "souvenirs",
        []
    )
# ============================================================
#                    ACTIONS DE NOVA 3.0
# ============================================================

import os
import subprocess
import webbrowser


def ouvrir_chrome():

    try:
        subprocess.Popen(
            ["cmd", "/c", "start", "", "chrome"]
        )

        return "J'ouvre Google Chrome."

    except Exception as erreur:

        print("Erreur Chrome :", erreur)

        return "Je n'arrive pas à ouvrir Chrome."


def ouvrir_youtube():

    try:
        webbrowser.open(
            "https://www.youtube.com"
        )

        return "J'ouvre YouTube."

    except Exception as erreur:

        print("Erreur YouTube :", erreur)

        return "Je n'arrive pas à ouvrir YouTube."


def ouvrir_google():

    try:
        webbrowser.open(
            "https://www.google.com"
        )

        return "J'ouvre Google."

    except Exception as erreur:

        print("Erreur Google :", erreur)

        return "Je n'arrive pas à ouvrir Google."


def ouvrir_vscode():

    try:
        subprocess.Popen(
            ["code"]
        )

        return "J'ouvre Visual Studio Code."

    except Exception as erreur:

        print("Erreur VS Code :", erreur)

        return "Je n'arrive pas à ouvrir Visual Studio Code."


def ouvrir_site(url):

    try:

        webbrowser.open(url)

        return f"J'ouvre {url}."

    except Exception as erreur:

        print("Erreur navigateur :", erreur)

        return "Je n'arrive pas à ouvrir ce site."
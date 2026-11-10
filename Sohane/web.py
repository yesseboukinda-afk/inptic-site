# ============================================================
#                    WEB DE NOVA 3.0
# ============================================================

from ddgs import DDGS
import webbrowser


def rechercher_sur_internet(requete, nombre=5):

    try:

        resultats = []

        with DDGS() as recherche:

            resultats_bruts = recherche.text(
                requete,
                max_results=nombre
            )

            for resultat in resultats_bruts:

                resultats.append({
                    "titre": resultat.get("title", ""),
                    "url": resultat.get("href", ""),
                    "description": resultat.get("body", "")
                })

        return resultats

    except Exception as erreur:

        print(
            "Erreur recherche Internet :",
            erreur
        )

        return []


def ouvrir_resultat(resultat):

    try:

        url = resultat.get("url")

        if not url:
            return False

        webbrowser.open(url)

        return True

    except Exception as erreur:

        print(
            "Erreur ouverture résultat :",
            erreur
        )

        return False


def afficher_resultats(resultats):

    if not resultats:

        print("\nAucun résultat trouvé.\n")

        return

    print("\n==============================")
    print("      🌐 RÉSULTATS WEB")
    print("==============================")

    for numero, resultat in enumerate(
        resultats,
        start=1
    ):

        print(f"\n[{numero}] {resultat['titre']}")

        print(
            resultat["description"]
        )

        print(
            resultat["url"]
        )

    print("\n==============================")
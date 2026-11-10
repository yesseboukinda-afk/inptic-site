# ============================================================
#                    CERVEAU DE NOVA 3.0
# ============================================================

import ollama

from config import MODELE_OLLAMA


class CerveauNOVA:

    def __init__(self, system_prompt):

        self.messages = [
            {
                "role": "system",
                "content": system_prompt
            }
        ]

    def repondre(self, texte):

        self.messages.append(
            {
                "role": "user",
                "content": texte
            }
        )

        try:

            response = ollama.chat(
                model=MODELE_OLLAMA,
                messages=self.messages
            )

            reponse = response["message"]["content"]

            self.messages.append(
                {
                    "role": "assistant",
                    "content": reponse
                }
            )

            return reponse

        except Exception as erreur:

            print("Erreur Ollama :", erreur)

            return (
                "Je rencontre actuellement "
                "un problème avec mon cerveau."
            )
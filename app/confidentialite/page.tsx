export default function ConfidentialitePage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-16 text-slate-800">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 md:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">INPTIC</p>
        <h1 className="mt-4 text-3xl font-black md:text-4xl">Politique de confidentialité</h1>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700 md:text-base">
          <p>
            L’INPTIC s’engage à protéger la vie privée des visiteurs et des utilisateurs de ce site. Cette
            politique de confidentialité décrit les informations que nous collectons, comment nous les
            utilisons et dans quelles limites elles peuvent être traitées.
          </p>

          <p>
            Les informations collectées peuvent inclure les données fournies volontairement via des
            formulaires de contact, d’inscription ou de candidature, ainsi que des informations techniques
            nécessaires au bon fonctionnement du site (adresse IP, navigateur, pages consultées, etc.).
          </p>

          <p>
            Les données sont utilisées uniquement dans le cadre de la gestion des demandes, de l’accès aux
            services, de l’amélioration des contenus et du respect des obligations légales.
          </p>

          <p>
            L’INPTIC ne vend ni ne loue les données personnelles à des tiers. Les informations peuvent
            toutefois être partagées avec des prestataires techniques strictement nécessaires au bon
            fonctionnement du site, dans le respect de la confidentialité.
          </p>

          <p>
            Les utilisateurs disposent du droit d’accéder, de corriger ou de retirer leurs données
            personnelles, dans les limites prévues par la réglementation applicable. Pour toute demande,
            ils peuvent contacter l’INPTIC via les moyens mis à disposition sur le site.
          </p>

          <p>
            Nous mettons en place des mesures raisonnables pour protéger les données contre la perte, la
            modification ou l’accès non autorisé. Toutefois, aucun système de transmission ou de stockage
            n’est totalement exempt de risque.
          </p>
        </div>
      </div>
    </main>
  );
}

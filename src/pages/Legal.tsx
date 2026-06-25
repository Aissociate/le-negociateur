import Layout from '../components/Layout';
import Markdown from '../components/Markdown';

// Contenu de base conforme RGPD. Les champs [À COMPLÉTER] doivent être renseignés
// avant mise en production (raison sociale, SIRET, DPO, hébergeur réel…).

const MENTIONS = `# Mentions légales

## Éditeur
Le présent site « Le Négociateur » est édité par **[À COMPLÉTER : raison sociale]**, [À COMPLÉTER : forme juridique] au capital de [À COMPLÉTER] €, immatriculée au RCS de [À COMPLÉTER] sous le numéro **[À COMPLÉTER : SIREN/SIRET]**, dont le siège social est situé [À COMPLÉTER : adresse].

- Directeur de la publication : **[À COMPLÉTER : nom]**
- Contact : **[À COMPLÉTER : email]**
- TVA intracommunautaire : [À COMPLÉTER]

## Hébergement
Le site est hébergé par **Vercel Inc.** (340 S Lemon Ave #4133, Walnut, CA 91789, USA). Les données applicatives et les traitements serveur sont opérés via **Supabase** (PostgreSQL + Edge Functions).

## Propriété intellectuelle
L'ensemble des contenus (textes, analyses, livrables générés, marque, logo) est protégé. Toute reproduction sans autorisation est interdite. Les livrables générés sont destinés à un usage personnel de l'acheteur.

## Avertissement
Les analyses et estimations fournies sont **indicatives**, établies à partir de données sourcées (INSEE, DARES, APEC, France Travail). Elles ne constituent ni une garantie de résultat, ni un conseil juridique ou financier réglementé. Pour toute situation de litige (discrimination, contentieux), rapprochez-vous d'un avocat.`;

const CONFIDENTIALITE = `# Politique de confidentialité

**Dernière mise à jour : [À COMPLÉTER]**

## Responsable de traitement
**[À COMPLÉTER : raison sociale]** — contact : **[À COMPLÉTER : email / DPO]**.

## Données collectées
- **Diagnostic gratuit** : poste, secteur, séniorité, localisation, rémunération, adresse email.
- **Achat & personnalisation** : éléments de rémunération, profil professionnel et réalisations que vous renseignez, email.
- **Compte client** : email d'authentification, historique de commandes, accès aux livrables.
- **Données techniques** : journaux de connexion, mesure d'audience (Plausible, sans cookie).

## Finalités & base légale
- Réaliser votre analyse de positionnement et générer vos livrables — **exécution du contrat / mesures précontractuelles**.
- Vous envoyer votre analyse et nos conseils — **consentement** (case à cocher, désinscription à tout clic).
- Gérer paiements, factures et abonnement — **obligation contractuelle et légale**.
- Améliorer le service et prévenir la fraude — **intérêt légitime**.

## Destinataires / sous-traitants
Vos données sont traitées par des sous-traitants engagés contractuellement : **Supabase** (base de données / hébergement applicatif), **Stripe** (paiement), **Resend** (emails), **OpenRouter** (génération IA des analyses), **Vercel** (hébergement front), **Apify** (le cas échéant, prospection B2B). Aucune donnée n'est revendue.

## Durée de conservation
- Prospects / leads : jusqu'à 3 ans après le dernier contact.
- Clients : durée de la relation + délais légaux (facturation : 10 ans).
- Vous pouvez demander l'effacement à tout moment (voir ci-dessous).

## Vos droits
Vous disposez des droits d'accès, de rectification, d'effacement, d'opposition, de limitation et de portabilité. Pour les exercer : **[À COMPLÉTER : email]**. Vous pouvez introduire une réclamation auprès de la **CNIL** (www.cnil.fr).

## Transferts hors UE
Certains sous-traitants (Stripe, Vercel, OpenRouter) peuvent traiter des données hors UE, encadrés par les clauses contractuelles types de la Commission européenne.

## Cookies & mesure d'audience
Le site utilise une mesure d'audience respectueuse de la vie privée (**Plausible**, sans cookie ni traçage individuel). Aucun cookie publicitaire n'est déposé.`;

export default function Legal({ page }: { page: 'mentions' | 'confidentialite' }) {
  return (
    <Layout narrow>
      <div className="prose-invert max-w-none text-paper/85">
        <Markdown>{page === 'mentions' ? MENTIONS : CONFIDENTIALITE}</Markdown>
      </div>
    </Layout>
  );
}

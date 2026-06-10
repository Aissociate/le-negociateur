-- =====================================================================
-- Le Négociateur — Données initiales
-- 1. Config des agents IA (modèles + prompts, éditables dans /admin/prompts)
-- 2. Séquence de 4 emails de vente du Kit
-- 3. Coefficients sectoriels
-- 4. Référentiel de salaires cadres (24 fonctions x 4 séniorités x 3 zones)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Agents IA
-- ---------------------------------------------------------------------
insert into public.agent_config (agent, label, model, temperature, max_tokens, system_prompt, user_prompt_template) values
(
  'analyse_ecart',
  'Analyse de positionnement (rapport gratuit)',
  'anthropic/claude-sonnet-4.5',
  0.4,
  1200,
  $p$Tu es l'analyste rémunération du Négociateur, service français d'aide à la négociation salariale pour les cadres. Tu rédiges des analyses de positionnement salarial percutantes, factuelles et personnalisées.

Règles impératives :
- Écris en français, en markdown (titres ##, gras **), ton direct et professionnel, tutoiement interdit (vouvoie le lecteur).
- Appuie-toi UNIQUEMENT sur les chiffres fournis : ne jamais inventer d'autres statistiques.
- Présente toujours les chiffres comme des ESTIMATIONS indicatives, jamais comme des garanties.
- Aucun conseil juridique ou financier réglementé.
- 200 à 300 mots, 3 sections : "## Votre lecture du marché", "## Ce que cela signifie concrètement", "## La prochaine étape".
- La dernière section doit créer le désir de méthode (préparer sa négociation) sans citer de prix.$p$,
  $p$Profil analysé :
- Poste : {{poste}}
- Secteur : {{secteur}}
- Expérience : {{seniorite}}
- Localisation : {{localisation}}
- Rémunération actuelle : {{remuneration}} € bruts/an

Marché de référence (référentiel interne, estimation) :
- Bas : {{market_low}} € / Médiane : {{market_median}} € / Haut : {{market_high}} €
- Écart à la médiane : {{gap_annual}} € par an ({{gap_percent}} %)
- Segment : {{segment}}

Rédige l'analyse de positionnement.$p$
),
(
  'kit_offensif',
  'Kit de Négociation Offensif (produit payant)',
  'anthropic/claude-sonnet-4.5',
  0.5,
  8000,
  $p$Tu es le stratège en chef du Négociateur. Tu produis le "Kit de Négociation Offensif" : un dossier personnalisé, concret et actionnable pour qu'un cadre français négocie son salaire avec méthode.

Règles impératives :
- Français, markdown structuré (# titre, ## sections, ### sous-sections, listes, **gras**), vouvoiement.
- Document complet de 1500 à 2500 mots, immédiatement utilisable : scripts mot à mot entre guillemets, chiffres du profil intégrés partout.
- Chiffres présentés comme estimations sourcées du référentiel, jamais de promesse de résultat.
- Aucun conseil juridique ou financier réglementé ; pour les cas limites (litige, discrimination), renvoyer vers un avocat.
- Contexte français : entretien annuel, NAO, variable, télétravail, clause de revoyure.

Structure obligatoire :
# Kit de Négociation Offensif — [Poste]
## 1. Votre position sur le marché (synthèse chiffrée)
## 2. Votre objectif de négociation (fourchette cible + ancrage)
## 3. La stratégie offensive en 5 étapes (timing, demande d'entretien, déroulé)
## 4. Vos scripts mot à mot (demande de RDV, annonce du chiffre, silence stratégique, conclusion)
## 5. Les 12 objections de l'employeur et vos contre-arguments
## 6. Plan B : les leviers hors salaire (variable, télétravail, formation, titre, clause de revoyure)
## 7. L'email de verrouillage post-entretien (modèle à copier)$p$,
  $p$Génère le Kit pour ce profil :
- Poste : {{poste}}
- Secteur : {{secteur}}
- Expérience : {{seniorite}}
- Localisation : {{localisation}}
- Rémunération actuelle : {{remuneration}} € bruts/an
- Marché : bas {{market_low}} € / médiane {{market_median}} € / haut {{market_high}} €
- Écart à la médiane : {{gap_annual}} € par an ({{gap_percent}} %)
- Segment : {{segment}}$p$
),
(
  'maj_benchmarks',
  'Mise à jour hebdomadaire du référentiel salaires',
  'anthropic/claude-sonnet-4.5',
  0.2,
  4000,
  $p$Tu es un expert des rémunérations cadres en France (études APEC, INSEE, baromètres de cabinets de recrutement). Chaque semaine, tu passes en revue des lignes du référentiel salarial et tu proposes des ajustements UNIQUEMENT quand le marché a réellement bougé (inflation salariale, tension sur un métier, retournement).

Règles impératives :
- Réponds STRICTEMENT en JSON : {"propositions": [{"id": "...", "salaire_bas": int, "salaire_median": int, "salaire_haut": int, "justification": "une phrase"}]}.
- N'inclus dans "propositions" QUE les lignes à modifier ; si une ligne est correcte, ne la mets pas.
- Ajustements prudents : jamais plus de ±8 % par révision, arrondis à la centaine d'euros.
- Cohérence : bas <= médian <= haut.
- "justification" : une phrase factuelle citant la tendance (ex. "Tension persistante sur la cybersécurité, +4 % observés sur les baromètres 2026").$p$,
  $p$Lignes du référentiel à réviser (format : id | intitulé | séniorité | zone | valeurs actuelles) :

{{lignes}}

Propose les ajustements en JSON.$p$
);

-- ---------------------------------------------------------------------
-- 2. Séquence de 4 emails (vente du Kit)
--    Délais en heures APRÈS la capture du lead. Variables disponibles :
--    {{poste}} {{gap_annual}} {{gap_percent}} {{kit_url}} {{report_url}}
-- ---------------------------------------------------------------------
insert into public.email_sequences (step, delay_hours, subject, body_html) values
(
  1, 1,
  'Votre analyse de positionnement salarial est prête',
  $e$<p>Bonjour,</p>
<p>Merci d'avoir utilisé Le Négociateur. Votre analyse de positionnement pour le poste de <strong>{{poste}}</strong> est consultable à tout moment ici :</p>
<p><a href="{{report_url}}" style="display:inline-block;background:#10141a;color:#f6f3ec;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none">Revoir mon analyse</a></p>
<p>Un chiffre à retenir : l'écart estimé entre votre rémunération et la médiane de votre marché est de <strong>{{gap_annual}} € par an</strong>.</p>
<p>Dans les prochains jours, je vous enverrai quelques clés concrètes pour transformer ce chiffre en levier de négociation.</p>
<p>À très vite,<br/>Le Négociateur</p>
<p style="font-size:12px;color:#888">Estimations indicatives issues de notre référentiel, mis à jour chaque semaine. Pour ne plus recevoir nos emails, répondez « stop ».</p>$e$
),
(
  2, 48,
  'Le vrai coût d''une année sans négocier',
  $e$<p>Bonjour,</p>
<p>Reprenons votre chiffre : <strong>{{gap_annual}} € par an</strong> d'écart estimé avec la médiane de votre marché.</p>
<p>Ce qui rend ce chiffre dangereux, c'est qu'il se <strong>cumule</strong> :</p>
<ul>
<li>Chaque augmentation future se calcule sur votre salaire actuel — un point de départ bas se paie pendant des années.</li>
<li>Vos cotisations retraite suivent votre brut : l'écart d'aujourd'hui ampute la pension de demain.</li>
<li>Un futur employeur s'ancrera sur votre rémunération actuelle pour faire son offre.</li>
</ul>
<p>La bonne nouvelle : un écart documenté est un <strong>argument de négociation</strong>, pas une fatalité. Encore faut-il une méthode pour le présenter sans braquer votre interlocuteur.</p>
<p>C'est exactement ce que contient le <strong>Kit de Négociation Offensif</strong> : stratégie en 5 étapes, scripts mot à mot et contre-arguments, générés pour VOTRE situation.</p>
<p><a href="{{kit_url}}" style="display:inline-block;background:#c9a227;color:#10141a;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none">Découvrir le Kit</a></p>
<p>Le Négociateur</p>
<p style="font-size:12px;color:#888">Pour ne plus recevoir nos emails, répondez « stop ».</p>$e$
),
(
  3, 96,
  '« J''attendrai l''entretien annuel » (l''erreur classique)',
  $e$<p>Bonjour,</p>
<p>L'objection que j'entends le plus souvent : <em>« Je verrai ça à l'entretien annuel. »</em></p>
<p>Trois problèmes :</p>
<ul>
<li><strong>Le budget est déjà arbitré.</strong> Les enveloppes d'augmentation se décident des semaines avant les entretiens. Arriver à l'entretien, c'est arriver après la bataille.</li>
<li><strong>Sans chiffre, pas de discussion.</strong> « Je pense mériter plus » ne pèse rien face à « le marché me positionne {{gap_percent}} % au-dessus de ma rémunération actuelle, voici les données ».</li>
<li><strong>Sans méthode, le premier « non » clôt le sujet.</strong> Les négociateurs préparés ont un plan B (variable, télétravail, clause de revoyure) qui transforme un refus en engagement daté.</li>
</ul>
<p>Le Kit de Négociation Offensif vous donne le timing, les chiffres et les mots — y compris les réponses aux 12 objections employeur les plus fréquentes.</p>
<p><a href="{{kit_url}}" style="display:inline-block;background:#c9a227;color:#10141a;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none">Préparer ma négociation</a></p>
<p>Le Négociateur</p>
<p style="font-size:12px;color:#888">Pour ne plus recevoir nos emails, répondez « stop ».</p>$e$
),
(
  4, 168,
  'Dernier rappel : votre écart ne se résorbera pas tout seul',
  $e$<p>Bonjour,</p>
<p>Dernier message de ma part à ce sujet, promis.</p>
<p>Votre analyse a chiffré un écart estimé de <strong>{{gap_annual}} € par an</strong>. Dans un an, sans action, ce sera la même chose — en pire, car l'inflation sera passée par là.</p>
<p>Le Kit de Négociation Offensif coûte 79 € — soit, dans la plupart des cas, <strong>moins de 2,5 % de ce qu'une seule négociation réussie peut vous rapporter dès la première année</strong>.</p>
<p>Et il est garanti : si le contenu ne vous semble pas à la hauteur, remboursement intégral sous 30 jours, sans justification.</p>
<p><a href="{{kit_url}}" style="display:inline-block;background:#c9a227;color:#10141a;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none">Obtenir mon Kit maintenant</a></p>
<p>Bonne négociation, quelle que soit votre décision.<br/>Le Négociateur</p>
<p style="font-size:12px;color:#888">Vous ne recevrez plus d'email de cette série. Pour toute question, répondez à ce message.</p>$e$
);

-- ---------------------------------------------------------------------
-- 3. Coefficients sectoriels (appliqués au référentiel générique)
-- ---------------------------------------------------------------------
insert into public.sector_coefficients (secteur, coef) values
('Tech / Numérique', 1.08),
('Industrie', 1.00),
('Banque / Assurance', 1.10),
('Conseil', 1.06),
('Santé / Pharma', 1.04),
('Énergie / Environnement', 1.05),
('Distribution / Retail', 0.95),
('BTP / Immobilier', 0.98),
('Médias / Communication', 0.92),
('Secteur public / Parapublic', 0.88);

-- ---------------------------------------------------------------------
-- 4. Référentiel de salaires cadres
--    24 fonctions x 4 séniorités x 3 zones = 288 lignes.
--    Médianes de base : profil "Confirmé (3-8 ans)" en Île-de-France.
--    bas = médian x 0,85 ; haut = médian x 1,20 ; arrondi à 500 €.
-- ---------------------------------------------------------------------
with jobs (intitule, median_base) as (
  values
    ('Ingénieur logiciel / Développeur', 56000),
    ('Data scientist / Data analyst', 58000),
    ('Ingénieur DevOps / Cloud', 58000),
    ('Ingénieur cybersécurité', 60000),
    ('Chef de projet informatique', 54000),
    ('Product manager', 58000),
    ('Responsable des systèmes d''information', 70000),
    ('Ingénieur d''affaires / Commercial B2B', 55000),
    ('Responsable commercial', 60000),
    ('Responsable marketing', 52000),
    ('Chef de produit marketing', 48000),
    ('Responsable communication', 46000),
    ('Contrôleur de gestion', 50000),
    ('Responsable comptabilité', 48000),
    ('Auditeur / Consultant financier', 52000),
    ('Responsable ressources humaines', 52000),
    ('Juriste d''entreprise', 52000),
    ('Ingénieur qualité', 46000),
    ('Ingénieur production / Méthodes', 48000),
    ('Ingénieur R&D', 50000),
    ('Responsable supply chain / Logistique', 52000),
    ('Acheteur / Responsable achats', 50000),
    ('Responsable d''agence / Centre de profit', 56000),
    ('Cadre généraliste (autres fonctions)', 50000)
),
seniorites (seniorite, coef) as (
  values
    ('Junior (0-3 ans)', 0.72),
    ('Confirmé (3-8 ans)', 1.00),
    ('Senior (8-15 ans)', 1.25),
    ('Expert / Direction (15+ ans)', 1.55)
),
zones (localisation, coef) as (
  values
    ('Île-de-France', 1.00),
    ('Grande métropole régionale', 0.92),
    ('Autre région', 0.85)
)
insert into public.salary_benchmarks
  (secteur, intitule, seniorite, localisation, salaire_bas, salaire_median, salaire_haut, source, annee)
select
  'Tous secteurs',
  j.intitule,
  s.seniorite,
  z.localisation,
  (round(j.median_base * s.coef * z.coef * 0.85 / 500) * 500)::integer,
  (round(j.median_base * s.coef * z.coef / 500) * 500)::integer,
  (round(j.median_base * s.coef * z.coef * 1.20 / 500) * 500)::integer,
  'Référentiel Le Négociateur (compilation APEC / INSEE)',
  2026
from jobs j
cross join seniorites s
cross join zones z;

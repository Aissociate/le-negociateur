-- =====================================================================
-- Bascule du copy stocké en base : vouvoiement -> tutoiement (proximité).
-- (Le front est déjà converti. Pages légales conservées en vouvoiement.)
-- Idempotent.
-- =====================================================================

-- 1. Prompts IA : la consigne « vouvoiement » devient « tutoiement »
update public.agent_config set
  system_prompt = replace(system_prompt, 'vouvoiement', 'tutoiement'),
  user_prompt_template = replace(user_prompt_template, 'vouvoiement', 'tutoiement'),
  updated_at = now();

-- 2. Descriptions produits
update public.products set description_md =
  'Entraîne-toi en illimité face à un « manager » IA qui objecte et négocie. Scoring et feedback pour arriver le jour J avec une confiance totale.'
where slug = 'simulateur';

update public.products set description_md =
  'Ton co-pilote rémunération en continu : veille mensuelle de ton positionnement, alertes quand l''écart se recreuse, régénération illimitée du Kit, simulateur illimité.'
where slug = 'bouclier';

update public.products set description_md =
  'La version essentielle : ton positionnement chiffré, tes 3 scripts clés, le top 5 des objections et ta phrase d''ancrage.'
where slug = 'argumentaire-eclair';

-- 3. Étapes OTO
update public.oto_steps set
  headline = 'Une dernière chose, et tu seras imbattable.',
  subhead = 'Tu as le dossier. Ajoute l''entraînement : affronte un manager IA jusqu''à ce que ta demande soit parfaitement rodée — en un clic, sans ressaisir ta carte.'
where upsell_slug = 'simulateur';

-- 4. Séquence d'emails (sujets + corps) en tutoiement
update public.email_sequences set
  subject = 'Ton analyse de positionnement salarial est prête',
  body_html = $e$<p>Bonjour,</p>
<p>Merci d'avoir utilisé Le Négociateur. Ton analyse de positionnement pour le poste de <strong>{{poste}}</strong> est consultable à tout moment ici :</p>
<p><a href="{{report_url}}" style="display:inline-block;background:#10141a;color:#f6f3ec;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none">Revoir mon analyse</a></p>
<p>Un chiffre à retenir : l'écart estimé entre ta rémunération et la médiane de ton marché est de <strong>{{gap_annual}} € par an</strong>.</p>
<p>Dans les prochains jours, je t'enverrai quelques clés concrètes pour transformer ce chiffre en levier de négociation.</p>
<p>À très vite,<br/>Le Négociateur</p>
<p style="font-size:12px;color:#888">Estimations indicatives issues de notre référentiel, mis à jour régulièrement. Pour ne plus recevoir nos emails, réponds « stop ».</p>$e$
where step = 1;

update public.email_sequences set
  subject = 'Le vrai coût d''une année sans négocier',
  body_html = $e$<p>Bonjour,</p>
<p>Reprenons ton chiffre : <strong>{{gap_annual}} € par an</strong> d'écart estimé avec la médiane de ton marché.</p>
<p>Ce qui rend ce chiffre dangereux, c'est qu'il se <strong>cumule</strong> :</p>
<ul>
<li>Chaque augmentation future se calcule sur ton salaire actuel — un point de départ bas se paie pendant des années.</li>
<li>Tes cotisations retraite suivent ton brut : l'écart d'aujourd'hui ampute la pension de demain.</li>
<li>Un futur employeur s'ancrera sur ta rémunération actuelle pour faire son offre.</li>
</ul>
<p>La bonne nouvelle : un écart documenté est un <strong>argument de négociation</strong>, pas une fatalité.</p>
<p>C'est exactement ce que contient le <strong>Kit de Négociation</strong> : stratégie en 5 étapes, scripts mot à mot et contre-arguments, générés pour TA situation.</p>
<p><a href="{{kit_url}}" style="display:inline-block;background:#c9a227;color:#10141a;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none">Découvrir le Kit</a></p>
<p>Le Négociateur</p>
<p style="font-size:12px;color:#888">Pour ne plus recevoir nos emails, réponds « stop ».</p>$e$
where step = 2;

update public.email_sequences set
  subject = '« J''attendrai l''entretien annuel » (l''erreur classique)',
  body_html = $e$<p>Bonjour,</p>
<p>L'objection que j'entends le plus souvent : <em>« Je verrai ça à l'entretien annuel. »</em></p>
<p>Trois problèmes :</p>
<ul>
<li><strong>Le budget est déjà arbitré.</strong> Les enveloppes d'augmentation se décident des semaines avant les entretiens.</li>
<li><strong>Sans chiffre, pas de discussion.</strong> « Je pense mériter plus » ne pèse rien face à « le marché me positionne {{gap_percent}} % au-dessus de ma rémunération actuelle, voici les données ».</li>
<li><strong>Sans méthode, le premier « non » clôt le sujet.</strong> Les négociateurs préparés ont un plan B qui transforme un refus en engagement daté.</li>
</ul>
<p>Le Kit de Négociation te donne le timing, les chiffres et les mots — y compris les réponses aux 12 objections employeur les plus fréquentes.</p>
<p><a href="{{kit_url}}" style="display:inline-block;background:#c9a227;color:#10141a;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none">Préparer ma négociation</a></p>
<p>Le Négociateur</p>
<p style="font-size:12px;color:#888">Pour ne plus recevoir nos emails, réponds « stop ».</p>$e$
where step = 3;

update public.email_sequences set
  subject = 'Dernier rappel : ton écart ne se résorbera pas tout seul',
  body_html = $e$<p>Bonjour,</p>
<p>Dernier message de ma part à ce sujet, promis.</p>
<p>Ton analyse a chiffré un écart estimé de <strong>{{gap_annual}} € par an</strong>. Dans un an, sans action, ce sera la même chose — en pire, car l'inflation sera passée par là.</p>
<p>Le Kit de Négociation coûte <strong>49 €</strong> — soit, dans la plupart des cas, <strong>moins de 1 % de ce qu'une seule négociation réussie peut te rapporter dès la première année</strong>.</p>
<p>Et il est garanti : si le contenu ne te semble pas à la hauteur, remboursement intégral sous 30 jours, sans justification.</p>
<p><a href="{{kit_url}}" style="display:inline-block;background:#c9a227;color:#10141a;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none">Obtenir mon Kit maintenant</a></p>
<p>Bonne négociation, quelle que soit ta décision.<br/>Le Négociateur</p>
<p style="font-size:12px;color:#888">Tu ne recevras plus d'email de cette série. Pour toute question, réponds à ce message.</p>$e$
where step = 4;

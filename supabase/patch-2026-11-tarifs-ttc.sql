-- Fairy House — patch 2026-11 : tarifs ronds en TTC (bloc « Séjour » de la page Le Lieu).
-- Met « 45€ / nuit / personne » → « 50€ / nuit / personne » dans le contenu CMS
-- (la valeur en base prime sur le défaut du code). Idempotent.

insert into site_content (key, value, updated_at)
values (
  'lelieu.confort.sejour_items',
  $val$Chambres partagées (de 3 à 5 personnes)
50€ / nuit / personne
Privatisation à partir de 700€ et accueille jusqu’à 14 personnes
Salles de bain communes
Linge de maison en option : 8€ / personne - qui comprend drap housse, housse de couette, taie d’oreiller et serviette de bain$val$,
  now()
)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- Fairy House — patch 2026-08 : mise à jour du bloc « Séjour » (page Le Lieu → Confort).
-- Aligne la capacité (14 personnes) et le tarif de privatisation (600€), et détaille
-- le linge de maison. Le contenu est stocké dans site_content (prime sur le défaut du code).
-- Idempotent : ré-exécutable sans risque.

insert into site_content (key, value, updated_at)
values (
  'lelieu.confort.sejour_items',
  $val$Chambres partagées (de 3 à 5 personnes)
45€ / nuit / personne
Privatisation à partir de 600€ et accueille jusqu’à 14 personnes
Salles de bain communes
Linge de maison en option : 8€ / personne - qui comprend drap housse, housse de couette, taie d’oreiller et serviette de bain$val$,
  now()
)
on conflict (key) do update set value = excluded.value, updated_at = now();

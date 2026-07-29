# Modèles de documents & e-mails — inventaire pour validation client

_Recette juillet 2026 — réponses aux questions ouvertes Q1 et Q2._

## Q1 — Modèles présents dans le code (à valider)

### 1. E-mail de confirmation
- **Fichier :** `api/_lib/confirmation.ts` (fonction `confirmationEmail`).
- **Déclenché par :** `api/send-confirmation.ts` (bouton « Envoyer la confirmation » en back-office) et `api/book.ts` (automatique à la validation d'une demande en ligne).
- **Sert pour :** réservation de séjour **et** inscription à un événement (contenu adapté).
- **Contenu :** en-tête doré « FAIRY HOUSE », message d'accueil, encart « Récapitulatif »
  (référence, type/événement, dates arrivée/départ ou date, hébergement, navette,
  nombre de personnes, montant si > 0), bloc contact, pied de page. Versions HTML + texte.

### 2. E-mail « devis + coordonnées bancaires » (paiement par virement)
- **Fichier :** HTML en ligne dans `api/book.ts` (automatique si paiement = virement) et
  `api/send-devis.ts` (envoi manuel depuis le back-office).
- **Contenu :** en-tête doré, total TTC, plan de paiement en 2 fois le cas échéant
  (acompte / solde / échéance), **coordonnées bancaires (RIB)**, note éventuelle,
  **devis PDF en pièce jointe**.

### 3. Devis PDF (pièce jointe)
- **Fichier :** `api/_lib/devis-pdf.ts` (fonction `buildDevisPdf`).
- **Contenu (A4) :** en-tête doré ; émetteur (nom, adresse, e-mail, téléphone, **SIRET**,
  **N° TVA**) ; bloc « DEVIS » (n°, date, durée de validité) ; destinataire ; tableau
  (Désignation / Qté / PU HT / Total HT) ; totaux (Total HT, **TVA mono-taux ou détail
  multi-taux 10 %/20 %**, Total TTC) ; case « Bon pour accord » ; RIB si virement ; pied.
- **Numérotation :** `DEV-AAAA-NNNNN` (fonction SQL `next_devis_reference`), stockée en table `devis`.

### 4. Textes par défaut (consentements à l'inscription événement)
- **Fichier :** `src/lib/eventPricing.ts` : `DEFAULT_REGLEMENT` (règlement intérieur) et
  `DEFAULT_DROITS_IMAGE` (droits à l'image). Surchargables par événement en back-office.

### ⚠️ Éléments à compléter avant mise en production « réelle »
Ces valeurs sont aujourd'hui des espaces réservés / variables d'environnement :
- **Téléphone** `+33 1 23 45 67 89` (factice, présent dans les 3 modèles) → à remplacer.
- **E-mail** `contact@fairyhousecollectif.com` → à confirmer.
- **SIRET** et **N° TVA** (devis PDF) → variables `FH_SIRET` / `FH_TVA` (sinon « à compléter »).
- **RIB** (IBAN / BIC / titulaire) → variables `FH_RIB_IBAN` / `FH_RIB_BIC` / `FH_RIB_TITULAIRE`.

## Q2 — Facture

**Constat : aucun modèle de facture n'existe dans le code.** Seul le **devis** est géré
(PDF + table `devis` + numérotation `DEV-…`). Il n'y a ni gabarit de facture, ni
numérotation de facture, ni table dédiée.

**Recommandation :** le générateur `buildDevisPdf` est très proche de ce qu'exige une
facture. Créer une facture consisterait à :
- un gabarit « FACTURE » (dérivé du devis) : mention « FACTURE », date d'émission,
  numérotation dédiée `FAC-AAAA-NNNNN`, date/échéance de paiement, retrait de la case
  « Bon pour accord » et de la « validité » ;
- une table `factures` + fonction `next_facture_reference` ;
- un point d'entrée d'émission (bouton back-office « Générer la facture » depuis une
  réservation confirmée).

C'est une **nouvelle fonctionnalité** (hors périmètre du recette) : à décider avec le client.

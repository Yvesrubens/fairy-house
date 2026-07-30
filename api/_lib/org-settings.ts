// Coordonnées & informations de facturation, éditables depuis le back-office
// (table org_settings). Repli sur les valeurs par défaut / variables
// d'environnement si un champ est vide ou si la table est indisponible.

export interface OrgSettings {
  contactEmail: string
  contactPhone: string
  address: string
  siret: string
  tva: string
  rib: { iban: string; bic: string; titulaire: string }
}

export const DEFAULT_ORG: OrgSettings = {
  contactEmail: 'fairyhouse.collectif@gmail.com',
  contactPhone: '+33 6 71 39 88 07',
  address: '2 Le Grand Leu, 45230 La Chapelle sur Aveyron',
  siret: process.env.FH_SIRET || 'SIREN : transmis séparément',
  tva: process.env.FH_TVA || 'TVA en cours d’attribution',
  rib: {
    iban: process.env.FH_RIB_IBAN || 'IBAN : à compléter',
    bic: process.env.FH_RIB_BIC || 'BIC : à compléter',
    titulaire: process.env.FH_RIB_TITULAIRE || 'Fairy House',
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchOrgSettings(supabase: any): Promise<OrgSettings> {
  try {
    const { data } = await supabase
      .from('org_settings')
      .select('*')
      .eq('id', 'org')
      .maybeSingle()
    if (!data) return DEFAULT_ORG
    return {
      contactEmail: data.contact_email || DEFAULT_ORG.contactEmail,
      contactPhone: data.contact_phone || DEFAULT_ORG.contactPhone,
      address: data.address || DEFAULT_ORG.address,
      siret: data.siret || DEFAULT_ORG.siret,
      tva: data.tva || DEFAULT_ORG.tva,
      rib: {
        iban: data.rib_iban || DEFAULT_ORG.rib.iban,
        bic: data.rib_bic || DEFAULT_ORG.rib.bic,
        titulaire: data.rib_titulaire || DEFAULT_ORG.rib.titulaire,
      },
    }
  } catch {
    return DEFAULT_ORG
  }
}

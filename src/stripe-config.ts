export interface StripeProduct {
  priceId: string;
  productId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  mode: 'payment' | 'subscription';
}

export const STRIPE_PRODUCTS: Record<string, StripeProduct> = {
  argumentaire_eclair: {
    priceId: 'price_1ToC3oHHlKshr0AB0yp5yVcJ',
    productId: 'prod_UnnfpAsm8BhJZX',
    name: 'Argumentaire Éclair',
    description:
      "Ta position en un coup d'œil — les faits chiffrés : rémunération, médiane + haut de fourchette du marché, écart, position, métier en tension. Ta phrase d'ancrage — la phrase exacte à dire pour annoncer ton chiffre cible (ancré vers le haut de fourchette). Tes 3 scripts essentiels (mot à mot) — demander le rendez-vous · annoncer le chiffre · répondre à un premier refus. Top 5 des objections + tes réponses — courtes, appuyées sur tes chiffres.",
    price: 19,
    currency: 'eur',
    mode: 'payment',
  },
  simulateur: {
    priceId: 'price_1TmKVmHHlKshr0ABiaZrLdgv',
    productId: 'prod_UlsGGJA3jzYkKq',
    name: 'Entrainement à la Négociation IA',
    description:
      '🎭 Plusieurs personas de recruteur — tu choisis ton « manager » (direct/factuel attaché au budget, etc.) avant de lancer. 💬 Entretien réaliste mené par l\'IA — elle joue le recruteur, connaît ta situation (issue de ton analyse) et mène la discussion. 🎙️ Réponse à l\'écrit ou à la voix — reconnaissance vocale intégrée (Chrome). 🏆 Débrief + note sur 10 — bouton « Demander un débrief » : analyse de ta performance et scoring. ♾️ Illimité — tu recommences autant de fois que tu veux jusqu\'à être à l\'aise.',
    price: 24,
    currency: 'eur',
    mode: 'payment',
  },
  kit: {
    priceId: 'price_1TmKTqHHlKshr0ABHpYlQC0n',
    productId: 'prod_UlsEFkiiZN6M7O',
    name: 'Kit de Négociation',
    description:
      "Tout ce qu'il te faut pour transformer ton écart de salaire en augmentation réelle. Généré à partir de ton analyse, le Kit te donne : ton argumentaire chiffré personnalisé, ta stratégie en 5 étapes, tes scripts mot à mot (demande, chiffre, silence, conclusion), tes réponses aux 12 objections les plus fréquentes, ton plan B hors salaire + ton email de verrouillage.",
    price: 99,
    currency: 'eur',
    mode: 'payment',
  },
};

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return Object.values(STRIPE_PRODUCTS).find((p) => p.priceId === priceId);
}

export function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(price);
}
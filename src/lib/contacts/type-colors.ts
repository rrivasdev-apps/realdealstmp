// Maps the fixed contact_types names (see supabase/migrations) to the
// contact-type color tokens in globals.css -- one place to look up "what
// color is this contact type" for badges/pills in the Contact Hub.
const CONTACT_TYPE_COLORS: Record<string, { text: string; bg: string; dot: string }> = {
  Investor: { text: 'text-contact-type-investor', bg: 'bg-contact-type-investor/10', dot: 'bg-contact-type-investor' },
  Realtor: { text: 'text-contact-type-realtor', bg: 'bg-contact-type-realtor/10', dot: 'bg-contact-type-realtor' },
  Lender: { text: 'text-contact-type-lender', bg: 'bg-contact-type-lender/10', dot: 'bg-contact-type-lender' },
  Vendor: { text: 'text-contact-type-vendor', bg: 'bg-contact-type-vendor/10', dot: 'bg-contact-type-vendor' },
  Seller: { text: 'text-contact-type-seller', bg: 'bg-contact-type-seller/10', dot: 'bg-contact-type-seller' },
  'Mortgage Company': {
    text: 'text-contact-type-mortgage-company',
    bg: 'bg-contact-type-mortgage-company/10',
    dot: 'bg-contact-type-mortgage-company',
  },
  'Title Company': {
    text: 'text-contact-type-title-company',
    bg: 'bg-contact-type-title-company/10',
    dot: 'bg-contact-type-title-company',
  },
  Other: { text: 'text-contact-type-other', bg: 'bg-contact-type-other/10', dot: 'bg-contact-type-other' },
}

const FALLBACK = { text: 'text-muted-foreground', bg: 'bg-muted', dot: 'bg-muted-foreground' }

export function contactTypeColors(typeName: string | null | undefined) {
  return (typeName && CONTACT_TYPE_COLORS[typeName]) || FALLBACK
}

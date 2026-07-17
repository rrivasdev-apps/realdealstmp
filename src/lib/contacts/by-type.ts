// Shared by every picker that needs "contacts of type X" (Realtor/Investor
// on offers; Title Company/Mortgage Company/Seller on deals) -- filters in
// JS after a normal RLS-scoped fetch, same pattern the rest of the app uses
// rather than a DB-level embedded filter.
export type ContactWithTypes = {
  id: string
  name: string
  contact_contact_types: { contact_types: { name: string } | null }[]
}

export function filterContactsByType(contacts: ContactWithTypes[], typeName: string) {
  return contacts
    .filter((contact) => contact.contact_contact_types.some((row) => row.contact_types?.name === typeName))
    .map((contact) => ({ id: contact.id, name: contact.name }))
}

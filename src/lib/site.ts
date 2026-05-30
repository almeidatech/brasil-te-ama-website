/**
 * Multi-tenant site scoping.
 *
 * The Supabase project is shared across sites (olmeda-pet, brasil-te-ama).
 * Isolation is BY APP: every query in this app filters by SITE_ID and every
 * insert sets site_id = SITE_ID. RLS still allows public read across sites,
 * so this scoping is what keeps each app showing only its own content.
 *
 * Set NEXT_PUBLIC_SITE_ID in the environment (see supabase `sites` table):
 *   brasil-te-ama -> 22222222-2222-2222-2222-222222222222
 */
export const SITE_ID =
  process.env.NEXT_PUBLIC_SITE_ID || '22222222-2222-2222-2222-222222222222';

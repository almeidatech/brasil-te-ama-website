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

/**
 * Storage isolation for the shared `blog-media` bucket.
 *
 * The bucket is shared with olmeda-pet. Unlike `posts`/`categories` (which carry
 * a `site_id` column), the `media` table and Storage objects are NOT scoped by a
 * column — isolation is BY PATH PREFIX. Every object this app writes lives under
 * `blog-media/brasil-te-ama/...` and the media manager only lists that prefix.
 */
export const MEDIA_BUCKET = 'blog-media';
export const MEDIA_PREFIX = 'brasil-te-ama';

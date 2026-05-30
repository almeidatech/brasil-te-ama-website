// Public-blog data layer — reads from Supabase using the anon key (server-side).
// RLS limits anon to status='published' AND published_at <= now().
import { createClient } from '@supabase/supabase-js';
import { marked } from 'marked';
import { SITE_ID } from './site';
import type { Database } from '@/types/database';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function client() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false },
  });
}

export interface PublicPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_html: string;       // rendered from body_md
  published_at: string | null;
  reading_time_min: number | null;
  seo_title: string | null;
  seo_description: string | null;
  category: { slug: string; name: string; color: string | null } | null;
  tags: string[];
  cover_url: string | null;   // for in-page hero
  og_image_url: string | null; // social preview; falls back to cover
}

interface MediaJoin { public_url: string | null; storage_path: string | null }
interface PostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_md: string | null;
  published_at: string | null;
  reading_time_min: number | null;
  seo_title: string | null;
  seo_description: string | null;
  tags: string[];
  categories: { slug: string; name: string; color: string | null } | null;
  cover_image: MediaJoin | null;
  og_image: MediaJoin | null;
}

const SELECT = `
  id, slug, title, excerpt, body_md, published_at, reading_time_min,
  seo_title, seo_description, tags,
  categories(slug, name, color),
  cover_image:cover_image_id(public_url, storage_path),
  og_image:og_image_id(public_url, storage_path)
`.replace(/\s+/g, ' ').trim();

function mediaUrl(m: MediaJoin | null): string | null {
  if (!m) return null;
  if (m.public_url) return m.public_url;
  if (m.storage_path) {
    const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
    return base ? `${base}/storage/v1/object/public/blog-media/${m.storage_path}` : null;
  }
  return null;
}

function toPublic(row: PostRow): PublicPost {
  const html = row.body_md ? marked.parse(row.body_md, { async: false }) as string : '';
  const cover = mediaUrl(row.cover_image);
  const og = mediaUrl(row.og_image) ?? cover;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body_html: html,
    published_at: row.published_at,
    reading_time_min: row.reading_time_min,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    category: row.categories,
    tags: row.tags ?? [],
    cover_url: cover,
    og_image_url: og,
  };
}

export async function getAllPublishedPosts(): Promise<PublicPost[]> {
  const { data, error } = await client()
    .from('posts')
    .select(SELECT)
    .eq('site_id', SITE_ID)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false });
  if (error) {
    console.error('[posts] getAllPublishedPosts:', error.message);
    return [];
  }
  return ((data ?? []) as unknown as PostRow[]).map(toPublic);
}

export async function getPublishedPostBySlug(slug: string): Promise<PublicPost | null> {
  const { data, error } = await client()
    .from('posts')
    .select(SELECT)
    .eq('site_id', SITE_ID)
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .maybeSingle();
  if (error) {
    console.error('[posts] getPublishedPostBySlug:', error.message);
    return null;
  }
  if (!data) return null;
  return toPublic(data as unknown as PostRow);
}

export async function getAllPublishedSlugs(): Promise<string[]> {
  const { data, error } = await client()
    .from('posts')
    .select('slug')
    .eq('site_id', SITE_ID)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString());
  if (error) {
    console.error('[posts] getAllPublishedSlugs:', error.message);
    return [];
  }
  return (data ?? []).map((r: { slug: string }) => r.slug);
}

export interface PublicCategory { slug: string; name: string; color: string | null }
export async function getAllCategories(): Promise<PublicCategory[]> {
  const { data, error } = await client()
    .from('categories')
    .select('slug, name, color')
    .eq('site_id', SITE_ID)
    .order('order_index');
  if (error) {
    console.error('[posts] getAllCategories:', error.message);
    return [];
  }
  return (data ?? []) as unknown as PublicCategory[];
}

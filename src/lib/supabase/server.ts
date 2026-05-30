import { createServerClient, serializeCookieHeader } from '@supabase/ssr';
import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import type { Database } from '@/types/database';

type Ctx =
  | GetServerSidePropsContext
  | { req: NextApiRequest; res: NextApiResponse };

export function createSupabaseServerClient(ctx: Ctx) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.entries(ctx.req.cookies ?? {}).map(([name, value]) => ({
            name,
            value: value as string,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            ctx.res.appendHeader('Set-Cookie', serializeCookieHeader(name, value, options));
          });
        },
      },
    },
  );
}

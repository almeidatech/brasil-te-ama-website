// Triggers on-demand ISR for the public /conteudo pages after an admin edit.
// Calls an authenticated admin-only API route — the REVALIDATE_SECRET stays
// server-side and is never shipped to the browser. Best-effort: if it fails,
// the time-based ISR (revalidate: 60) on /conteudo catches up anyway.
export async function revalidateConteudo(slug?: string): Promise<void> {
  try {
    await fetch('/api/admin/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slug ? { slug } : {}),
    });
  } catch {
    // swallow — ISR will reconcile on its next interval
  }
}

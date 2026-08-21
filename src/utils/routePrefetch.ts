// Pré-carrega em segundo plano as rotas mais usadas, acelerando a troca de telas.
let started = false;

const ROUTES: Array<() => Promise<unknown>> = [
  () => import('@/pages/Dashboard'),
  () => import('@/pages/Schedule'),
  () => import('@/pages/Clients'),
  () => import('@/pages/MyPatients'),
  () => import('@/pages/MedicalRecords'),
];

const runIdle = (fn: () => void) => {
  const ric = (window as any).requestIdleCallback;
  if (typeof ric === 'function') ric(fn, { timeout: 3000 });
  else setTimeout(fn, 1200);
};

export const prefetchCoreRoutes = () => {
  if (started) return;
  started = true;

  // Não desperdiça dados em conexões lentas ou modo economia
  const conn = (navigator as any).connection;
  if (conn?.saveData || /2g/.test(conn?.effectiveType || '')) return;

  let i = 0;
  const next = () => {
    if (i >= ROUTES.length) return;
    const load = ROUTES[i++];
    load().catch(() => {}).finally(() => runIdle(next));
  };
  runIdle(next);
};

// Pré-carrega em segundo plano os chunks das rotas mais usadas.
// Acelera a troca de telas e abertura simultânea de várias abas.
// Usa requestIdleCallback para não competir com o boot inicial.

type Loader = () => Promise<unknown>;

// Rotas priorizadas pela frequência de uso real do sistema.
const HIGH_PRIORITY: Loader[] = [
  () => import('@/pages/Dashboard'),
  () => import('@/pages/Schedule'),
  () => import('@/pages/MyPatients'),
  () => import('@/pages/Clients'),
  () => import('@/pages/MedicalRecords'),
];

const MEDIUM_PRIORITY: Loader[] = [
  () => import('@/pages/Reports'),
  () => import('@/pages/Financial'),
  () => import('@/pages/AttendanceValidation'),
  () => import('@/pages/Anamnesis'),
  () => import('@/pages/Timesheet'),
  () => import('@/pages/WaitingList'),
];

const LOW_PRIORITY: Loader[] = [
  () => import('@/pages/Neuroassessment'),
  () => import('@/pages/Contracts'),
  () => import('@/pages/ContractTemplates'),
  () => import('@/pages/EmployeesNew'),
  () => import('@/pages/StockManager'),
  () => import('@/pages/ScheduleControl'),
  () => import('@/pages/DirectMessages'),
  () => import('@/pages/MyFiles'),
  () => import('@/pages/MeetingAlerts'),
  () => import('@/pages/EmployeeControl'),
  () => import('@/pages/FeedbackControl'),
  () => import('@/pages/UserManagement'),
  () => import('@/pages/CustomRoles'),
];

const idle = (cb: () => void, timeout = 2000) => {
  const w = window as any;
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(cb, { timeout });
  } else {
    setTimeout(cb, timeout);
  }
};

const runSequential = async (loaders: Loader[]) => {
  for (const load of loaders) {
    try {
      await load();
    } catch {
      // chunk pode falhar offline — ignorar
    }
    await new Promise<void>((r) => idle(() => r()));
  }
};

let started = false;

export const prefetchRoutes = () => {
  if (started) return;
  started = true;

  // Evita pré-carregar em conexões lentas / economia de dados.
  const conn = (navigator as any).connection;
  if (conn?.saveData) return;
  if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return;

  idle(async () => {
    await runSequential(HIGH_PRIORITY);
    idle(async () => {
      await runSequential(MEDIUM_PRIORITY);
      idle(() => {
        void runSequential(LOW_PRIORITY);
      }, 5000);
    }, 3000);
  }, 1500);
};

// In-memory Firebase RTDB REST fake that meters download bytes.
export type Meter = { bytes: number; calls: number; byKind: Record<string, { bytes: number; calls: number }> };

const typeRank = (v: unknown) =>
  v === null || v === undefined ? 0 : v === false ? 1 : v === true ? 2 : typeof v === "number" ? 3 : typeof v === "string" ? 4 : 5;
function cmp(a: unknown, b: unknown) {
  const ra = typeRank(a), rb = typeRank(b);
  if (ra !== rb) return ra - rb;
  if (ra === 3) return (a as number) - (b as number);
  if (ra === 4) return (a as string) < (b as string) ? -1 : (a as string) > (b as string) ? 1 : 0;
  return 0;
}

export function createFakeRtdb(root: any) {
  const meter: Meter = { bytes: 0, calls: 0, byKind: {} };
  const parse = (url: string) => {
    const u = new URL(url);
    const path = u.pathname.replace(/\.json$/, "").split("/").filter(Boolean);
    return { path, q: u.searchParams };
  };
  const get = (path: string[]) => path.reduce((n: any, k) => (n == null ? undefined : n[k]), root);
  const set = (path: string[], v: any) => {
    let n = root;
    for (const k of path.slice(0, -1)) n = n[k] ??= {};
    if (v === null) delete n[path[path.length - 1]];
    else n[path[path.length - 1]] = v;
  };
  const kindOf = (path: string[], q: URLSearchParams) => {
    const p = path.map((s, i) => (i === 1 && path[0] === "trips" ? "$trip" : i === 2 && path[0] === "trips" && path[3] === "expenses" ? "$uid" : i === 1 && path[0] === "users" ? "$uid" : s)).join("/");
    return p + (q.get("shallow") ? "?shallow" : "") + (q.get("orderBy") ? "?delta" : "");
  };
  const record = (kind: string, data: unknown) => {
    const bytes = data === undefined ? 4 : JSON.stringify(data ?? null).length;
    meter.bytes += bytes; meter.calls++;
    const k = (meter.byKind[kind] ??= { bytes: 0, calls: 0 });
    k.bytes += bytes; k.calls++;
  };
  const axiosImpl = {
    get: async (url: string) => {
      const { path, q } = parse(url);
      let data = get(path);
      if (q.get("shallow") && data && typeof data === "object") data = Object.fromEntries(Object.keys(data).map((k) => [k, true]));
      const orderBy = q.get("orderBy");
      if (orderBy && data && typeof data === "object") {
        const child = JSON.parse(orderBy);
        const startAt = q.has("startAt") ? JSON.parse(q.get("startAt")!) : undefined;
        data = Object.fromEntries(Object.entries(data).filter(([, v]: any) => startAt === undefined || cmp(v?.[child], startAt) >= 0));
      }
      record(kindOf(path, q), data);
      return { data: data ?? null };
    },
    patch: async (url: string, body: any) => { const { path } = parse(url); set(path, { ...(get(path) ?? {}), ...body }); return { data: body }; },
    put: async (url: string, body: any) => { const { path } = parse(url); set(path, body); return { data: body }; },
    post: async (url: string, body: any) => { const { path } = parse(url); const id = "-N" + Math.random().toString(36).slice(2); set([...path, id], body); return { data: { name: id } }; },
    delete: async (url: string) => { const { path } = parse(url); set(path, null); return { data: null }; },
  };
  return { root, meter, axiosImpl };
}

export function makeTrip(opts: { uids: string[]; expensesPerUid: number; withServerTs?: boolean; withEditedTs?: boolean }) {
  const trip: any = { tripName: "Big", tripCurrency: "EUR", totalBudget: "1000", dailyBudget: "10", travellers: {} };
  const base = 1_700_000_000_000;
  for (const uid of opts.uids) {
    trip.travellers["-k" + uid] = { uid, userName: uid, touched: false };
    const exps: any = {};
    for (let i = 0; i < opts.expensesPerUid; i++) {
      exps[`-e${uid}${i}`] = {
        amount: 12.5, calcAmount: 12.5, category: "food", currency: "EUR", country: "DE",
        date: new Date(base).toISOString(), startDate: new Date(base).toISOString(), endDate: new Date(base).toISOString(),
        description: "Lunch at a place with a moderately long name " + i, uid, whoPaid: uid, splitType: "EQUAL",
        splitList: opts.uids.map((u) => ({ userName: u, amount: 12.5 / opts.uids.length })),
        ...(opts.withEditedTs === false ? {} : { editedTimestamp: String(base + i) }),
        ...(opts.withServerTs === false ? {} : { serverTimestamp: base + i }),
      };
    }
    trip[uid] = { expenses: exps };
  }
  return trip;
}

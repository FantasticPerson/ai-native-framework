import { create } from 'zustand';
import { loadState, saveState } from '../../lib/persist';

export type LeaveStatus = '待审批' | '已通过' | '已驳回';

export interface Leave {
  id: string;
  type: string;
  days: number;
  date: string;
  reason: string;
  status: LeaveStatus;
}

interface LeaveState {
  list: Leave[];
  add: (l: Omit<Leave, 'id' | 'status'>) => void;
  approve: (id: string) => void;
  reject: (id: string) => void;
  approveLatest: () => void;
  rejectLatest: () => void;
}

const SEED: Leave[] = [
  { id: '1', type: '年假', days: 3, date: '2026-07-01', reason: '家庭出游', status: '已通过' },
  { id: '2', type: '病假', days: 1, date: '2026-07-10', reason: '感冒', status: '待审批' },
];

const KEY = 'leave';
let seq = Date.now();
const nextId = () => String(++seq);

/** 找到最新一条待审批记录的 id */
function latestPendingId(list: Leave[]): string | undefined {
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].status === '待审批') return list[i].id;
  }
  return undefined;
}

function setStatus(list: Leave[], id: string | undefined, status: LeaveStatus): Leave[] {
  if (!id) return list;
  return list.map((x) => (x.id === id ? { ...x, status } : x));
}

export const useLeaveStore = create<LeaveState>((set) => ({
  list: loadState<Leave[]>(KEY, SEED),
  add: (l) =>
    set((s) => {
      const list = [...s.list, { ...l, id: nextId(), status: '待审批' as LeaveStatus }];
      saveState(KEY, list);
      return { list };
    }),
  approve: (id) =>
    set((s) => {
      const list = setStatus(s.list, id, '已通过');
      saveState(KEY, list);
      return { list };
    }),
  reject: (id) =>
    set((s) => {
      const list = setStatus(s.list, id, '已驳回');
      saveState(KEY, list);
      return { list };
    }),
  approveLatest: () =>
    set((s) => {
      const list = setStatus(s.list, latestPendingId(s.list), '已通过');
      saveState(KEY, list);
      return { list };
    }),
  rejectLatest: () =>
    set((s) => {
      const list = setStatus(s.list, latestPendingId(s.list), '已驳回');
      saveState(KEY, list);
      return { list };
    }),
}));

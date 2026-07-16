import { create } from 'zustand';
import { loadState, saveState } from '../../lib/persist';

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  note: string;
}

interface ExpenseState {
  list: Expense[];
  filterCategory: string;
  add: (e: Omit<Expense, 'id'>) => void;
  setFilter: (c: string) => void;
}

const SEED: Expense[] = [
  { id: '1', category: '差旅', amount: 1200, date: '2026-07-02', note: '高铁票' },
  { id: '2', category: '餐饮', amount: 300, date: '2026-07-05', note: '团队聚餐' },
  { id: '3', category: '办公', amount: 500, date: '2026-07-08', note: '打印耗材' },
];

const KEY = 'expense';
let seq = Date.now();
const nextId = () => String(++seq);

export const useExpenseStore = create<ExpenseState>((set) => ({
  list: loadState<Expense[]>(KEY, SEED),
  filterCategory: '',
  add: (e) =>
    set((s) => {
      const list = [...s.list, { ...e, id: nextId() }];
      saveState(KEY, list);
      return { list };
    }),
  setFilter: (filterCategory) => set({ filterCategory }),
}));

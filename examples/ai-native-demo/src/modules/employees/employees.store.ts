import { create } from 'zustand';
import { loadState, saveState } from '../../lib/persist';

export interface Employee {
  id: string;
  name: string;
  dept: string;
  title: string;
  phone: string;
}

interface EmployeeState {
  list: Employee[];
  keyword: string;
  add: (e: Omit<Employee, 'id'>) => void;
  update: (id: string, e: Partial<Employee>) => void;
  remove: (id: string) => void;
  setKeyword: (k: string) => void;
}

const SEED: Employee[] = [
  { id: '1', name: '张伟', dept: '技术', title: '前端工程师', phone: '13800000001' },
  { id: '2', name: '李娜', dept: '产品', title: '产品经理', phone: '13800000002' },
  { id: '3', name: '王芳', dept: '运营', title: '运营专员', phone: '13800000003' },
];

const KEY = 'employees';

let seq = Date.now();
const nextId = () => String(++seq);

export const useEmployeeStore = create<EmployeeState>((set) => ({
  list: loadState<Employee[]>(KEY, SEED),
  keyword: '',
  add: (e) =>
    set((s) => {
      const list = [...s.list, { ...e, id: nextId() }];
      saveState(KEY, list);
      return { list };
    }),
  update: (id, e) =>
    set((s) => {
      const list = s.list.map((x) => (x.id === id ? { ...x, ...e } : x));
      saveState(KEY, list);
      return { list };
    }),
  remove: (id) =>
    set((s) => {
      const list = s.list.filter((x) => x.id !== id);
      saveState(KEY, list);
      return { list };
    }),
  setKeyword: (keyword) => set({ keyword }),
}));

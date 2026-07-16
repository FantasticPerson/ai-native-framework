import { useState } from 'react';
import { Modal } from '../../components/Modal';
import { Field } from '../../components/Field';
import { useEmployeeStore, type Employee } from './employees.store';

interface Props {
  open: boolean;
  editing: Employee | null;
  onClose: () => void;
}

const empty = { name: '', dept: '', title: '', phone: '' };

export function EmployeeForm({ open, editing, onClose }: Props) {
  const { add, update } = useEmployeeStore();
  const [form, setForm] = useState(empty);

  // 打开时同步编辑数据
  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setForm(editing ? { name: editing.name, dept: editing.dept, title: editing.title, phone: editing.phone } : empty);
  }

  const set = (k: keyof typeof empty) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (editing) update(editing.id, form);
    else add(form);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={editing ? '编辑员工' : '新增员工'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" data-ai-action="employees.submit" data-ai-label="保存员工" onClick={submit}>
            保存
          </button>
        </>
      }
    >
      <Field aiField="employees.name" aiLabel="姓名" type="text" value={form.name} onChange={set('name')} />
      <Field aiField="employees.dept" aiLabel="部门" type="select" options={['技术', '产品', '运营', '市场', '人事']} value={form.dept} onChange={set('dept')} />
      <Field aiField="employees.title" aiLabel="职位" type="text" value={form.title} onChange={set('title')} />
      <Field aiField="employees.phone" aiLabel="手机号" type="text" value={form.phone} onChange={set('phone')} />
    </Modal>
  );
}

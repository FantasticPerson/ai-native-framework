import { useState } from 'react';
import { Form, Input, Select } from 'antd';
import { Modal } from '../../components/Modal';
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
      <Form layout="vertical">
        <Form.Item name="name" label="姓名">
          <Input value={form.name} onChange={(e) => set('name')(e.target.value)} />
        </Form.Item>
        <Form.Item name="dept" label="部门">
          <Select
            value={form.dept || undefined}
            onChange={set('dept')}
            options={[
              { value: '技术', label: '技术' },
              { value: '产品', label: '产品' },
              { value: '运营', label: '运营' },
              { value: '市场', label: '市场' },
              { value: '人事', label: '人事' },
            ]}
          />
        </Form.Item>
        <Form.Item name="title" label="职位">
          <Input value={form.title} onChange={(e) => set('title')(e.target.value)} />
        </Form.Item>
        <Form.Item name="phone" label="手机号">
          <Input value={form.phone} onChange={(e) => set('phone')(e.target.value)} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

import { useState } from 'react';
import { Form, Input, InputNumber, DatePicker, Select } from 'antd';
import { Modal } from '../../components/Modal';
import { useExpenseStore } from './expense.store';

interface Props {
  open: boolean;
  onClose: () => void;
}

const empty = { category: '', amount: '', date: '', note: '' };

export function ExpenseForm({ open, onClose }: Props) {
  const { add } = useExpenseStore();
  const [form, setForm] = useState(empty);

  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setForm(empty);
  }

  const set = (k: keyof typeof empty) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    add({ category: form.category, amount: Number(form.amount) || 0, date: form.date, note: form.note });
    onClose();
  };

  return (
    <Modal
      open={open}
      title="新增报销"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" data-ai-action="expense.submit" data-ai-label="提交报销单" onClick={submit}>
            提交
          </button>
        </>
      }
    >
      <Form layout="vertical">
        <Form.Item name="category" label="报销类别">
          <Select
            value={form.category || undefined}
            onChange={set('category')}
            options={[
              { value: '差旅', label: '差旅' },
              { value: '餐饮', label: '餐饮' },
              { value: '办公', label: '办公' },
              { value: '其他', label: '其他' },
            ]}
          />
        </Form.Item>
        <Form.Item name="amount" label="报销金额">
          <InputNumber
            value={form.amount || undefined}
            onChange={(v) => set('amount')(v == null ? '' : String(v))}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item name="date" label="发生日期">
          <DatePicker
            value={undefined}
            onChange={(_, ds) => set('date')(Array.isArray(ds) ? ds[0] : ds)}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item name="note" label="备注说明">
          <Input value={form.note} onChange={(e) => set('note')(e.target.value)} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

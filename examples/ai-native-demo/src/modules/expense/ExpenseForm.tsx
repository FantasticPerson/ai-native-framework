import { useState } from 'react';
import { Modal } from '../../components/Modal';
import { Field } from '../../components/Field';
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
      <Field aiField="expense.category" aiLabel="报销类别" type="select" options={['差旅', '餐饮', '办公', '其他']} value={form.category} onChange={set('category')} />
      <Field aiField="expense.amount" aiLabel="报销金额" type="number" value={form.amount} onChange={set('amount')} />
      <Field aiField="expense.date" aiLabel="发生日期" type="date" value={form.date} onChange={set('date')} />
      <Field aiField="expense.note" aiLabel="备注说明" type="text" value={form.note} onChange={set('note')} />
    </Modal>
  );
}

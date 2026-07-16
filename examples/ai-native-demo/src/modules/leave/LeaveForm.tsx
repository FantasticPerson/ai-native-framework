import { useState } from 'react';
import { Modal } from '../../components/Modal';
import { Field } from '../../components/Field';
import { useLeaveStore } from './leave.store';

interface Props {
  open: boolean;
  onClose: () => void;
}

const empty = { type: '', days: '', date: '', reason: '' };

export function LeaveForm({ open, onClose }: Props) {
  const { add } = useLeaveStore();
  const [form, setForm] = useState(empty);

  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setForm(empty);
  }

  const set = (k: keyof typeof empty) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    add({ type: form.type, days: Number(form.days) || 0, date: form.date, reason: form.reason });
    onClose();
  };

  return (
    <Modal
      open={open}
      title="新增请假申请"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" data-ai-action="leave.submit" data-ai-label="提交请假申请" onClick={submit}>
            提交
          </button>
        </>
      }
    >
      <Field aiField="leave.type" aiLabel="请假类型" type="select" options={['事假', '病假', '年假', '调休']} value={form.type} onChange={set('type')} />
      <Field aiField="leave.days" aiLabel="请假天数" type="number" value={form.days} onChange={set('days')} />
      <Field aiField="leave.date" aiLabel="请假日期" type="date" value={form.date} onChange={set('date')} />
      <Field aiField="leave.reason" aiLabel="请假事由" type="text" value={form.reason} onChange={set('reason')} />
    </Modal>
  );
}

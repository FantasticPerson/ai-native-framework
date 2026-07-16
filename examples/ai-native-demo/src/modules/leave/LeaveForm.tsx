import { useState } from 'react';
import { Form, Input, InputNumber, DatePicker, Select } from 'antd';
import { Modal } from '../../components/Modal';
import { useLeaveStore } from './leave.store';

interface Props {
  open: boolean;
  onClose: () => void;
}

const empty = { type: '', days: '', date: '', reason: '' };

const LEAVE_TYPES = ['事假', '病假', '年假', '调休'];

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
      <Form layout="vertical">
        <Form.Item name="type" label="请假类型">
          <Select
            value={form.type || undefined}
            onChange={set('type')}
            options={LEAVE_TYPES.map((v) => ({ value: v, label: v }))}
          />
        </Form.Item>
        <Form.Item name="days" label="请假天数">
          <InputNumber
            value={form.days || undefined}
            onChange={(v) => set('days')(v == null ? '' : String(v))}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item name="date" label="请假日期">
          <DatePicker
            value={undefined}
            onChange={(_, ds) => set('date')(Array.isArray(ds) ? ds[0] : ds)}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item name="reason" label="请假事由">
          <Input value={form.reason} onChange={(e) => set('reason')(e.target.value)} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

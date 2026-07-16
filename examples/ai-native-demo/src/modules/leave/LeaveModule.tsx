import { useState } from 'react';
import { Table, type Column } from '../../components/Table';
import { LeaveForm } from './LeaveForm';
import { useLeaveStore, type Leave } from './leave.store';

const STATUS_CLASS: Record<string, string> = {
  待审批: 'tag tag-pending',
  已通过: 'tag tag-approved',
  已驳回: 'tag tag-rejected',
};

export function LeaveModule() {
  const { list, approve, reject, approveLatest, rejectLatest } = useLeaveStore();
  const [open, setOpen] = useState(false);

  const columns: Column<Leave>[] = [
    { key: 'type', title: '类型' },
    { key: 'days', title: '天数' },
    { key: 'date', title: '日期' },
    { key: 'reason', title: '事由' },
    { key: 'status', title: '状态', render: (r) => <span className={STATUS_CLASS[r.status]}>{r.status}</span> },
    {
      key: 'ops',
      title: '操作',
      render: (r) =>
        r.status === '待审批' ? (
          <>
            <button className="btn" onClick={() => approve(r.id)}>
              通过
            </button>{' '}
            <button className="btn btn-danger" onClick={() => reject(r.id)}>
              驳回
            </button>
          </>
        ) : (
          <span style={{ color: '#c9cdd4' }}>—</span>
        ),
    },
  ];

  return (
    <div>
      <div className="page-head">
        <div className="page-title">请假管理</div>
        <div className="toolbar">
          <button className="btn" data-ai-action="leave.approve" data-ai-label="审批通过最新待审批的请假" onClick={approveLatest}>
            通过最新
          </button>
          <button className="btn btn-danger" data-ai-action="leave.reject" data-ai-label="驳回最新待审批的请假" onClick={rejectLatest}>
            驳回最新
          </button>
          <button className="btn btn-primary" data-ai-action="leave.create" data-ai-label="新增请假申请" onClick={() => setOpen(true)}>
            新增请假
          </button>
        </div>
      </div>
      <Table columns={columns} data={list} rowKey={(r) => r.id} />
      <LeaveForm open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

import { useState } from 'react';
import { Table, type Column } from '../../components/Table';
import { EmployeeForm } from './EmployeeForm';
import { useEmployeeStore, type Employee } from './employees.store';

export function EmployeesModule() {
  const { list, keyword, setKeyword, remove } = useEmployeeStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const filtered = keyword ? list.filter((e) => e.name.includes(keyword) || e.dept.includes(keyword) || e.title.includes(keyword)) : list;

  const columns: Column<Employee>[] = [
    { key: 'name', title: '姓名' },
    { key: 'dept', title: '部门' },
    { key: 'title', title: '职位' },
    { key: 'phone', title: '手机号' },
    {
      key: 'ops',
      title: '操作',
      render: (row) => (
        <>
          <button
            className="btn"
            data-ai-action="employees.edit"
            data-ai-label="编辑员工"
            onClick={() => {
              setEditing(row);
              setOpen(true);
            }}
          >
            编辑
          </button>{' '}
          <button className="btn btn-danger" data-ai-action="employees.delete" data-ai-label="删除员工" onClick={() => remove(row.id)}>
            删除
          </button>
        </>
      ),
    },
  ];

  return (
    <div data-ai-module="employees" data-ai-label="员工管理" data-ai-route="/employees">
      <div className="page-head">
        <div className="page-title">员工管理</div>
        <div className="toolbar">
          <input
            data-ai-field="employees.keyword"
            data-ai-label="搜索关键词"
            data-ai-type="text"
            placeholder="搜索姓名/部门/职位"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ padding: '7px 10px', border: '1px solid #d0d3d9', borderRadius: 6 }}
          />
          <button className="btn" data-ai-action="employees.search" data-ai-label="搜索员工">
            搜索
          </button>
          <button
            className="btn btn-primary"
            data-ai-action="employees.create"
            data-ai-label="新增员工"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            新增员工
          </button>
        </div>
      </div>
      <Table columns={columns} data={filtered} rowKey={(r) => r.id} />
      <EmployeeForm open={open} editing={editing} onClose={() => setOpen(false)} />
    </div>
  );
}

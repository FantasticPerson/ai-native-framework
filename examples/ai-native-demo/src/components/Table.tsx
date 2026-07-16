import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  title: string;
  render?: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  empty?: string;
}

export function Table<T>({ columns, data, rowKey, empty = '暂无数据' }: TableProps<T>) {
  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key}>{c.title}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td className="table-empty" colSpan={columns.length}>
              {empty}
            </td>
          </tr>
        ) : (
          data.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(row) : (row as Record<string, ReactNode>)[c.key]}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

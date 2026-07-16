import type { ReactNode } from 'react';

interface BaseProps {
  /** data-ai-field 的 id，格式 module.name */
  aiField: string;
  aiLabel: string;
  value: string;
}

interface TextProps extends BaseProps {
  type?: 'text' | 'number' | 'date';
  onChange: (v: string) => void;
  placeholder?: string;
}

interface SelectProps extends BaseProps {
  type: 'select';
  options: string[];
  onChange: (v: string) => void;
}

type FieldProps = TextProps | SelectProps;

/**
 * 统一的表单字段：自动透传 data-ai-field / data-ai-label / data-ai-type / data-ai-options。
 * 所有模块必须用它渲染字段，保证标注写法一致、扫描器可稳定识别。
 */
export function Field(props: FieldProps): ReactNode {
  const { aiField, aiLabel, value } = props;

  if (props.type === 'select') {
    return (
      <label className="field">
        <span className="field-label">{aiLabel}</span>
        <select
          data-ai-field={aiField}
          data-ai-label={aiLabel}
          data-ai-type="select"
          data-ai-options={props.options.join(',')}
          value={value}
          onChange={(e) => props.onChange(e.target.value)}
        >
          <option value="">请选择</option>
          {props.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="field">
      <span className="field-label">{aiLabel}</span>
      <input
        data-ai-field={aiField}
        data-ai-label={aiLabel}
        data-ai-type={props.type ?? 'text'}
        type={props.type ?? 'text'}
        value={value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </label>
  );
}

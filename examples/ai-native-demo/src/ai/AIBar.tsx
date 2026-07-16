import { useMemo } from 'react';
import { AIBar as FrameworkAIBar, useAIAgent } from '@ai-native/react';
import { createHttpProvider, type Manifest } from '@ai-native/core';
import manifestJson from '../ai-manifest.json';

const manifest = manifestJson as Manifest;

const EXAMPLES = [
  '帮我提个明天的事假，一天，事由家里有事',
  '新增员工赵敏，技术部，职位后端工程师，手机 13900001111',
  '把报销按差旅筛选',
  '审批通过最新的请假',
  '切换到全年数据',
];

/** demo 的 AIBar：组合框架的 useAIAgent + AIBar，注入本应用的 manifest、provider、示例。 */
export function AIBar() {
  const provider = useMemo(() => createHttpProvider({ endpoint: '/api/chat' }), []);
  const agent = useAIAgent({ manifest, provider });

  return (
    <FrameworkAIBar
      agent={agent}
      examples={EXAMPLES}
      placeholder="说一句话，让 AI 帮你操作，例如「帮我提个明天的事假」"
    />
  );
}

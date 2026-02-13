import React from 'react';
import { useChangelogNaoLidas } from '@/hooks/useChangelog';

export const ChangelogBadge: React.FC = () => {
  const { data } = useChangelogNaoLidas();
  const count = data?.nao_lidas || 0;

  if (count === 0) return null;

  return (
    <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-blue-600 rounded-full">
      {count > 99 ? '99+' : count}
    </span>
  );
};

import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ElementType;
  title?: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title = 'Sem resultados',
  description,
  className = '',
  children,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-10 text-center ${className}`}>
      <Icon className="h-10 w-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">{description}</p>}
      {children}
    </div>
  );
};

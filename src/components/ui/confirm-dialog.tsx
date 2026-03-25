import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  loading = false,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
          >
            {loading ? 'A processar...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Hook para usar ConfirmDialog de forma imperativa
interface ConfirmState {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: 'default' | 'destructive';
  resolve?: (value: boolean) => void;
}

export function useConfirmDialog() {
  const [state, setState] = React.useState<ConfirmState>({ open: false, title: '' });

  const confirm = React.useCallback(
    (opts: { title: string; description?: string; confirmLabel?: string; variant?: 'default' | 'destructive' }): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({ ...opts, open: true, resolve });
      });
    },
    [],
  );

  const handleConfirm = React.useCallback(() => {
    state.resolve?.(true);
    setState((s) => ({ ...s, open: false }));
  }, [state]);

  const handleCancel = React.useCallback(() => {
    state.resolve?.(false);
    setState((s) => ({ ...s, open: false }));
  }, [state]);

  const DialogComponent = React.useMemo(
    () => (
      <ConfirmDialog
        open={state.open}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title={state.title}
        description={state.description}
        confirmLabel={state.confirmLabel}
        variant={state.variant}
      />
    ),
    [state.open, state.title, state.description, state.confirmLabel, state.variant, handleConfirm, handleCancel],
  );

  return { confirm, ConfirmDialogComponent: DialogComponent };
}

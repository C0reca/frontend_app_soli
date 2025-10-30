
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEmployees, Employee } from '@/hooks/useEmployees';
import { Loader2 } from 'lucide-react';

const employeeSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional().transform(val => val || undefined),
  cargo: z.string().optional().transform(val => val || undefined),
  departamento: z.string().optional().transform(val => val || undefined),
  cor: z.string().optional().transform(val => val || undefined),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  employee,
}) => {
  const { createEmployee, updateEmployee } = useEmployees();
  const isEditing = !!employee;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee || {
      nome: '',
      email: '',
      telefone: '',
      cargo: '',
      departamento: '',
      cor: '#3b82f6',
    },
  });

  React.useEffect(() => {
    if (employee) {
      reset({
        nome: employee.nome,
        email: employee.email,
        telefone: employee.telefone || '',
        cargo: employee.cargo || '',
        departamento: employee.departamento || '',
        cor: employee.cor || '#3b82f6',
      });
    } else {
      reset({
        nome: '',
        email: '',
        telefone: '',
        cargo: '',
        departamento: '',
        cor: '#3b82f6',
      });
    }
  }, [employee, reset]);

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      const employeeData = {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        cargo: data.cargo,
        departamento: data.departamento,
        cor: (data as any).cor,
      };
      
      if (isEditing && employee) {
        await updateEmployee.mutateAsync({ id: employee.id, ...employeeData });
      } else {
        await createEmployee.mutateAsync(employeeData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Funcionário' : 'Novo Funcionário'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Altere as informações do funcionário'
              : 'Preencha os dados do novo funcionário'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              {...register('nome')}
              placeholder="Nome do funcionário"
            />
            {errors.nome && (
              <p className="text-sm text-red-600">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="email@exemplo.com"
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              {...register('telefone')}
              placeholder="+351 123 456 789"
            />
            {errors.telefone && (
              <p className="text-sm text-red-600">{errors.telefone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cargo">Cargo</Label>
            <Input
              id="cargo"
              {...register('cargo')}
              placeholder="Cargo do funcionário"
            />
            {errors.cargo && (
              <p className="text-sm text-red-600">{errors.cargo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="departamento">Departamento</Label>
            <Input
              id="departamento"
              {...register('departamento')}
              placeholder="Departamento"
            />
            {errors.departamento && (
              <p className="text-sm text-red-600">{errors.departamento.message}</p>
            )}
          </div>

      <div className="space-y-2">
        <Label htmlFor="cor">Cor (Calendário)</Label>
        <Input
          id="cor"
          type="color"
          {...register('cor')}
        />
      </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

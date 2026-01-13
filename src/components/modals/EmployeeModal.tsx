
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Switch } from '@/components/ui/switch';
import { useEmployees, Employee, EmployeeRole } from '@/hooks/useEmployees';
import { Loader2 } from 'lucide-react';

const ROLE_OPTIONS: { value: EmployeeRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'funcionario', label: 'Funcionario' },
];

const employeeSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional().transform((val) => val || undefined),
  cargo: z.string().optional().transform((val) => val || undefined),
  departamento: z.string().optional().transform((val) => val || undefined),
  cor: z.string().optional().transform((val) => val || undefined),
  role: z.preprocess(
    (val) => {
      // Mapear 'employee' para 'funcionario' se necessário
      if (val === 'employee') return 'funcionario';
      return val;
    },
    z.enum(['admin', 'manager', 'funcionario']).default('funcionario')
  ),
  is_active: z.boolean().default(true),
  senha: z.string().optional(),
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
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      cargo: '',
      departamento: '',
      cor: '#3b82f6',
      role: 'funcionario',
      is_active: true,
      senha: '',
    },
  });

  React.useEffect(() => {
    if (employee) {
      // Garantir que o role está no formato correto
      let roleValue: 'admin' | 'manager' | 'funcionario' = 'funcionario';
      if (employee.role === 'admin' || employee.role === 'manager' || employee.role === 'funcionario') {
        roleValue = employee.role;
      } else if (employee.role === 'employee') {
        roleValue = 'funcionario'; // Mapear 'employee' para 'funcionario'
      }
      
      reset({
        nome: employee.nome,
        email: employee.email,
        telefone: employee.telefone || '',
        cargo: employee.cargo || '',
        departamento: employee.departamento || '',
        cor: employee.cor || '#3b82f6',
        role: roleValue,
        is_active: employee.is_active,
        senha: '',
      });
    } else {
      reset({
        nome: '',
        email: '',
        telefone: '',
        cargo: '',
        departamento: '',
        cor: '#3b82f6',
        role: 'funcionario',
        is_active: true,
        senha: '',
      });
    }
  }, [employee, reset]);

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      setFormError('');
      if (!isEditing && !data.senha) {
        setFormError('A senha é obrigatória para novos utilizadores.');
        return;
      }

      const payload = {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        cargo: data.cargo,
        departamento: data.departamento,
        cor: (data as any).cor,
        role: data.role as EmployeeRole,
        is_active: data.is_active,
        senha: data.senha || '',
      };
      
      if (isEditing && employee) {
        const updatePayload: any = { id: employee.id, ...payload };
        if (!data.senha) {
          delete updatePayload.senha;
        }
        await updateEmployee.mutateAsync(updatePayload);
      } else {
        await createEmployee.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto flex-1 pr-2">
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
            <Label>Perfil de acesso</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && (
              <p className="text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Conta ativa</Label>
              <p className="text-sm text-muted-foreground">
                Controla o acesso do funcionário ao sistema
              </p>
            </div>
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">{isEditing ? 'Nova senha (opcional)' : 'Senha inicial *'}</Label>
            <Input
              id="senha"
              type="password"
              placeholder={isEditing ? 'Deixe em branco para manter' : 'Mínimo 8 caracteres'}
              {...register('senha')}
            />
            {formError && !isEditing && (
              <p className="text-sm text-red-600">{formError}</p>
            )}
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Preencha para atualizar a senha do funcionário
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cor">Cor (Calendário)</Label>
            <Input id="cor" type="color" {...register('cor')} />
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

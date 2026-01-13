import React from 'react';
import { Employee } from '@/hooks/useEmployees';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mail, Phone, Briefcase, Building, Calendar, Shield, Power } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EmployeeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({
  isOpen,
  onClose,
  employee,
}) => {
  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhes do Funcionário
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header with name */}
          <div className="text-center border-b pb-4">
            <h2 className="text-xl font-semibold text-gray-900">{employee.nome}</h2>
            <p className="text-gray-600">{employee.email}</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {employee.role === 'admin'
                  ? 'Admin'
                  : employee.role === 'manager'
                    ? 'Manager'
                    : 'Funcionario'}
              </Badge>
              <Badge variant={employee.is_active ? 'default' : 'destructive'} className="flex items-center gap-1">
                <Power className="h-3 w-3" />
                {employee.is_active ? 'Ativo' : 'Desativado'}
              </Badge>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-gray-900">{employee.email}</p>
              </div>
            </div>

            {employee.telefone && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Telefone</p>
                  <p className="text-gray-900">{employee.telefone}</p>
                </div>
              </div>
            )}

            {employee.cargo && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Briefcase className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Cargo</p>
                  <p className="text-gray-900">{employee.cargo}</p>
                </div>
              </div>
            )}

            {employee.departamento && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Building className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Departamento</p>
                  <p className="text-gray-900">{employee.departamento}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Data de Criação</p>
                <p className="text-gray-900">
                  {new Date(employee.criado_em).toLocaleDateString('pt-PT')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface ClienteContacto {
  id?: number;
  cliente_id?: number;
  tipo: 'telefone' | 'email';
  valor: string;
  descricao?: string;
  principal: boolean;
}

interface ClienteContactosTabProps {
  clienteId?: number;
  contactosLocais?: ClienteContacto[];
  onContactosChange?: (contactos: ClienteContacto[]) => void;
}

export const ClienteContactosTab: React.FC<ClienteContactosTabProps> = ({ 
  clienteId, 
  contactosLocais,
  onContactosChange 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<ClienteContacto>({
    tipo: 'telefone',
    valor: '',
    descricao: '',
    principal: false,
  });

  // Se temos clienteId, usar API. Senão, usar contactos locais
  const isLocalMode = !clienteId && contactosLocais !== undefined;

  const { data: contactosApi = [], isLoading } = useQuery<ClienteContacto[]>({
    queryKey: ['cliente-contactos', clienteId],
    queryFn: async () => {
      const response = await api.get(`/clientes/${clienteId}/contactos`);
      return response.data;
    },
    enabled: !!clienteId,
  });

  const contactos = isLocalMode ? contactosLocais! : contactosApi;

  const createMutation = useMutation({
    mutationFn: async (data: ClienteContacto) => {
      const response = await api.post(`/clientes/${clienteId}/contactos`, {
        ...data,
        cliente_id: clienteId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-contactos', clienteId] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Sucesso",
        description: "Contacto adicionado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.response?.data?.detail || "Erro ao adicionar contacto.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ClienteContacto> }) => {
      const response = await api.put(`/clientes/${clienteId}/contactos/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-contactos', clienteId] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Sucesso",
        description: "Contacto atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.response?.data?.detail || "Erro ao atualizar contacto.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/clientes/${clienteId}/contactos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-contactos', clienteId] });
      toast({
        title: "Sucesso",
        description: "Contacto eliminado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.response?.data?.detail || "Erro ao eliminar contacto.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      tipo: 'telefone',
      valor: '',
      descricao: '',
      principal: false,
    });
    setEditingIndex(null);
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (index: number) => {
    const contacto = contactos[index];
    setFormData({ ...contacto });
    setEditingIndex(index);
    setIsDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    if (isLocalMode) {
      const novosContactos = contactos.filter((_, i) => i !== index);
      onContactosChange?.(novosContactos);
      toast({
        title: "Sucesso",
        description: "Contacto removido.",
      });
    } else {
      const contacto = contactos[index];
      if (contacto.id && confirm('Tem certeza que deseja eliminar este contacto?')) {
        deleteMutation.mutate(contacto.id);
      }
    }
  };

  const handleSave = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const valor = formData.valor?.trim() || '';
    if (!valor) {
      toast({
        title: "Erro",
        description: "O valor do contacto é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (formData.tipo === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(valor)) {
        toast({
          title: "Erro",
          description: "Por favor, insira um email válido.",
          variant: "destructive",
        });
        return;
      }
    }

    if (isLocalMode) {
      // Modo local: atualizar array local
      let novosContactos = [...contactos];
      
      // Se marcar como principal, remover principal de outros do mesmo tipo
      if (formData.principal) {
        novosContactos = novosContactos.map(c => 
          c.tipo === formData.tipo ? { ...c, principal: false } : c
        );
      }

      if (editingIndex !== null) {
        novosContactos[editingIndex] = { ...formData, valor };
      } else {
        novosContactos.push({ ...formData, valor });
      }

      onContactosChange?.(novosContactos);
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Sucesso",
        description: editingIndex !== null ? "Contacto atualizado." : "Contacto adicionado.",
      });
    } else {
      // Modo API: usar mutations
      if (editingIndex !== null && contactos[editingIndex].id) {
        updateMutation.mutate({ id: contactos[editingIndex].id!, data: { ...formData, valor } });
      } else {
        createMutation.mutate({ ...formData, valor });
      }
    }
  };

  const telefones = contactos.filter(c => c.tipo === 'telefone');
  const emails = contactos.filter(c => c.tipo === 'email');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Contactos</h3>
          <p className="text-xs text-muted-foreground">Gerir todos os contactos do cliente</p>
        </div>
        <Button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAdd();
          }} 
          size="sm"
          className="text-sm"
        >
          <Plus className="h-3 w-3 mr-1" />
          Adicionar Contacto
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-6 text-sm text-muted-foreground">A carregar...</div>
      ) : contactos.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Nenhum contacto adicionado ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {telefones.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>Telefones</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {telefones.map((contacto, index) => {
                    const globalIndex = contactos.indexOf(contacto);
                    return (
                      <div key={contacto.id || globalIndex} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{contacto.valor}</span>
                            {contacto.principal && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0">Principal</Badge>
                            )}
                          </div>
                          {contacto.descricao && (
                            <p className="text-xs text-muted-foreground mt-0.5">{contacto.descricao}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEdit(globalIndex);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete(globalIndex);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {emails.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Emails</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {emails.map((contacto, index) => {
                    const globalIndex = contactos.indexOf(contacto);
                    return (
                      <div key={contacto.id || globalIndex} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{contacto.valor}</span>
                            {contacto.principal && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0">Principal</Badge>
                            )}
                          </div>
                          {contacto.descricao && (
                            <p className="text-xs text-muted-foreground mt-0.5">{contacto.descricao}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEdit(globalIndex);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete(globalIndex);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          // Só permitir fechar se não estiver em processo de submissão
          if (!open && !createMutation.isPending && !updateMutation.isPending) {
            setIsDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? 'Editar Contacto' : 'Adicionar Contacto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value as 'telefone' | 'email' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="telefone">Telefone</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">
                {formData.tipo === 'telefone' ? 'Telefone' : 'Email'} *
              </Label>
              <Input
                id="valor"
                type={formData.tipo === 'email' ? 'email' : 'tel'}
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder={formData.tipo === 'telefone' ? '+351 123 456 789' : 'email@exemplo.com'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Input
                id="descricao"
                value={formData.descricao || ''}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Ex: Casa, Trabalho, Principal"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="principal"
                checked={formData.principal}
                onChange={(e) => setFormData({ ...formData, principal: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="principal" className="cursor-pointer">
                Marcar como contacto principal
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDialogOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending 
                ? 'A guardar...' 
                : editingIndex !== null 
                  ? 'Guardar' 
                  : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

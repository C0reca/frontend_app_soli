import React, { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, Palette, Lock, Shield, Clock, Loader2 } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  funcionario: 'Normal',
};

export const Profile: React.FC = () => {
  const { profile, isLoading, updateProfile, changePassword } = useProfile();
  const { updateUser } = useAuth();
  const { toast } = useToast();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cor, setCor] = useState('#3b82f6');

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  useEffect(() => {
    if (profile) {
      setNome(profile.nome || '');
      setEmail(profile.email || '');
      setTelefone(profile.telefone || '');
      setCor(profile.cor || '#3b82f6');
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await updateProfile.mutateAsync({ nome, email, telefone, cor });
      updateUser({ nome: result.nome, email: result.email });
      toast({ title: 'Perfil atualizado com sucesso.' });
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar perfil',
        description: err?.response?.data?.detail || 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha !== confirmarSenha) {
      toast({ title: 'As palavras-passe não coincidem.', variant: 'destructive' });
      return;
    }
    if (novaSenha.length < 6) {
      toast({ title: 'A nova palavra-passe deve ter pelo menos 6 caracteres.', variant: 'destructive' });
      return;
    }
    try {
      await changePassword.mutateAsync({ senha_atual: senhaAtual, nova_senha: novaSenha });
      toast({ title: 'Palavra-passe alterada com sucesso.' });
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (err: any) {
      toast({
        title: 'Erro ao alterar palavra-passe',
        description: err?.response?.data?.detail || 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">O Meu Perfil</h1>

      {/* Informação da conta (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Informação da Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Tipo de conta</span>
              <p className="font-medium">{ROLE_LABELS[profile?.role || 'funcionario'] || profile?.role}</p>
            </div>
            <div>
              <span className="text-gray-500">Cargo</span>
              <p className="font-medium">{profile?.cargo || '—'}</p>
            </div>
            <div>
              <span className="text-gray-500">Departamento</span>
              <p className="font-medium">{profile?.departamento || '—'}</p>
            </div>
            <div>
              <span className="text-gray-500">Membro desde</span>
              <p className="font-medium flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {profile?.criado_em ? new Date(profile.criado_em).toLocaleDateString('pt-PT') : '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados pessoais (editáveis) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Nome
              </Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email
              </Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Telefone
              </Label>
              <Input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cor" className="flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" /> Cor do perfil
              </Label>
              <div className="flex items-center gap-3">
                <input
                  id="cor"
                  type="color"
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                  className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                />
                <span className="text-sm text-gray-500">{cor}</span>
              </div>
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> A guardar...
                </>
              ) : (
                'Guardar Alterações'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Alterar palavra-passe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5" />
            Alterar Palavra-passe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senha-atual">Palavra-passe atual</Label>
              <Input
                id="senha-atual"
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nova-senha">Nova palavra-passe</Label>
              <Input
                id="nova-senha"
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmar-senha">Confirmar nova palavra-passe</Label>
              <Input
                id="confirmar-senha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="outline" disabled={changePassword.isPending}>
              {changePassword.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> A alterar...
                </>
              ) : (
                'Alterar Palavra-passe'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

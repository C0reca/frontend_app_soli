
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Upload, Download, Trash2, RotateCcw, FileText, Image, File } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';

export const Documents: React.FC = () => {
  const { documents, isLoading, uploadDocument, deleteDocument, restoreDocument, downloadDocument } = useDocuments();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'deleted'>('all');

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || doc.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getFileIcon = (type: string) => {
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type.toLowerCase())) {
      return <Image className="h-5 w-5 text-green-600" />;
    } else if (['pdf', 'doc', 'docx', 'txt'].includes(type.toLowerCase())) {
      return <FileText className="h-5 w-5 text-red-600" />;
    } else {
      return <File className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        await uploadDocument.mutateAsync(formData);
      }
      event.target.value = '';
    }
  };

  const handleDownload = (id: string, filename: string) => {
    downloadDocument(id, filename);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      await deleteDocument.mutateAsync(id);
    }
  };

  const handleRestore = async (id: string) => {
    await restoreDocument.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-600">Gerencie os documentos do sistema</p>
        </div>
        <div className="flex space-x-2">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Enviar Arquivo
              </span>
            </Button>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {documents.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {documents.filter(d => d.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Excluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {documents.filter(d => d.status === 'deleted').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tamanho Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              12.8 MB
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Documentos</CardTitle>
          <CardDescription>
            Gerencie uploads, downloads e exclusões
          </CardDescription>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex space-x-1">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todos
              </Button>
              <Button
                variant={filter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('active')}
              >
                Ativos
              </Button>
              <Button
                variant={filter === 'deleted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('deleted')}
              >
                Excluídos
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDocuments.map((document) => (
              <Card key={document.id} className={`hover:shadow-md transition-shadow ${document.status === 'deleted' ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      {getFileIcon(document.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium">{document.name}</h3>
                          <Badge className={getStatusColor(document.status)}>
                            {document.status === 'active' ? 'Ativo' : 'Excluído'}
                          </Badge>
                          {document.version > 1 && (
                            <Badge variant="outline">v{document.version}</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{document.size}</span>
                          <span>Por {document.uploadedBy}</span>
                          <span>em {new Date(document.uploadedAt).toLocaleDateString('pt-BR')}</span>
                          {document.process && (
                            <span className="text-blue-600">• {document.process}</span>
                          )}
                        </div>
                      </div>
                    </div>
                     <div className="flex space-x-2">
                       {document.status === 'active' ? (
                         <>
                           <Button variant="ghost" size="sm" onClick={() => handleDownload(document.id, document.name)}>
                             <Download className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(document.id)}>
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </>
                       ) : (
                         <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" onClick={() => handleRestore(document.id)}>
                           <RotateCcw className="h-4 w-4" />
                         </Button>
                       )}
                     </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

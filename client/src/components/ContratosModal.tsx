import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Calendar, Building2, Check, Loader2, Users, DollarSign, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { contratosService, ContratoDetallado } from '@/services/contratosService';
import { useQuery } from '@tanstack/react-query';

interface ContratosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContrato: (contrato: ContratoDetallado) => void;
}

const ContratosModal: React.FC<ContratosModalProps> = ({ isOpen, onClose, onSelectContrato }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Query para obtener contratos de la base de datos
  const { data: contratos = [], isLoading, error } = useQuery({
    queryKey: ["contratos", searchTerm],
    queryFn: async () => {
      if (searchTerm.trim()) {
        return await contratosService.search(searchTerm);
      }
      return await contratosService.getAll();
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const handleSelectContrato = (contrato: ContratoDetallado) => {
    onSelectContrato(contrato);
    onClose();
  };

  // Función para obtener el color del estado
  const getEstadoColor = (estado: any) => {
    if (!estado || typeof estado !== 'string') return 'bg-gray-50 text-gray-500 border-gray-200';
    
    const estadoUpper = estado.toUpperCase();
    const colors = {
      'ACTIVO': 'bg-green-50 text-green-700 border-green-200',
      'INACTIVO': 'bg-red-50 text-red-700 border-red-200',
      'PENDIENTE': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'EJECUTADO': 'bg-blue-50 text-blue-700 border-blue-200',
      'EN PROCESO': 'bg-orange-50 text-orange-700 border-orange-200',
      'CERRADO': 'bg-gray-50 text-gray-700 border-gray-200',
      'FINALIZADO': 'bg-purple-50 text-purple-700 border-purple-200',
    };
    return colors[estadoUpper as keyof typeof colors] || 'bg-gray-50 text-gray-600 border-gray-200';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[75vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-6 h-6 text-cyan-600" />
            Seleccionar Contrato
          </DialogTitle>
          <DialogDescription>
            Selecciona un contrato de la lista para completar el formulario
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          {/* Barra de búsqueda */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por número de contrato, cliente u objeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
            )}
          </div>

          {/* Tabla de contratos con scroll */}
          <div className="border rounded-lg overflow-hidden flex-1 min-h-0">
            <div className="h-full overflow-y-auto">
              <Table>
                <TableHeader className="bg-cyan-50 sticky top-0 z-10">
                  <TableRow>
                        <TableHead className="w-20 text-xs font-semibold">N° Contrato</TableHead>
                        <TableHead className="w-64 text-xs font-semibold">Cliente</TableHead>
                        <TableHead className="w-56 text-xs font-semibold">Objeto</TableHead>
                        <TableHead className="w-24 text-xs font-semibold text-center">Estado</TableHead>
                        <TableHead className="w-32 text-xs font-semibold text-center">Fechas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
                            <span className="text-gray-600">Cargando contratos...</span>
                          </div>
                        </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-red-500">
                        Error al cargar los contratos
                      </TableCell>
                    </TableRow>
                  ) : contratos.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                          No se encontraron contratos
                        </TableCell>
                    </TableRow>
                  ) : (
                    contratos.map((contrato) => (
                      <TableRow 
                        key={contrato.id} 
                        className="hover:bg-cyan-50 cursor-pointer transition-colors"
                        onClick={() => handleSelectContrato(contrato)}
                      >
                        <TableCell className="font-medium text-cyan-600 text-xs w-20">
                          <span className="font-semibold text-xs">
                            {contrato.numero_contrato || 'Sin número'}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-64 truncate text-xs" title={contrato.cliente}>
                          <span className="font-medium text-gray-900">
                            {contrato.cliente || 'Sin cliente'}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {contrato.sede?.nombre && `Sede: ${contrato.sede.nombre}`}
                            {contrato.zona?.nombre && ` • Zona: ${contrato.zona.nombre}`}
                            {contrato.n_ppl && ` • PPL: ${contrato.n_ppl}`}
                            {contrato.n_servicios && ` • Servicios: ${contrato.n_servicios}`}
                            {contrato.valor_total && ` • Valor: $${contrato.valor_total.toLocaleString()}`}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-56 truncate text-xs" title={contrato.objeto}>
                          <span className="font-medium text-gray-900">
                            {contrato.objeto || 'Sin objeto'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`text-xs px-2 py-1 font-medium ${getEstadoColor(contrato.estado_nombre || contrato.estado)}`}
                          >
                            {contrato.estado_nombre || contrato.estado || 'Sin estado'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-purple-500" />
                              <span className="font-bold text-purple-700 text-sm">
                                {contrato.fecha_inicial ? new Date(contrato.fecha_inicial).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-purple-500" />
                              <span className="font-bold text-purple-700 text-sm">
                                {contrato.fecha_final ? new Date(contrato.fecha_final).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContratosModal;

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Search, BarChart3, Save, RefreshCw, Loader2, Lock, CheckCircle, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLoading } from "@/contexts/LoadingContext";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

// Esquema de validación para crear/editar ciclo
const cicloSchema = z.object({
  item: z.number().min(1, "El item debe ser un número mayor a 0"),
  no_rqp: z.string().min(1, "El número RQP es requerido"),
  no_contrato: z.string().min(1, "El número de contrato es requerido"),
  entidad_contratante: z.string().min(1, "La entidad contratante es requerida"),
  fecha_planeacion_inicial: z.string().min(1, "La fecha inicial de planeación es requerida"),
  fecha_planeacion_final: z.string().min(1, "La fecha final de planeación es requerida"),
  fecha_planeacion_dias: z.number().min(1, "Los días de planeación deben ser mayor a 0"),
  numero_menu_inicial: z.number().min(1, "El número inicial del menú es requerido"),
  numero_menu_final: z.number().min(1, "El número final del menú es requerido"),
  fecha_contrato_inicial: z.string().min(1, "La fecha inicial del contrato es requerida"),
  fecha_contrato_final: z.string().min(1, "La fecha final del contrato es requerida"),
  fecha_contrato_ejecucion: z.string().min(1, "La fecha de ejecución del contrato es requerida"),
  cantidad_servicios: z.number().min(1, "La cantidad de servicios debe ser mayor a 0"),
  valor_total: z.number().min(0, "El valor total debe ser mayor o igual a 0"),
  estado: z.enum(["activo", "inactivo", "pendiente", "ejecutado"]),
});

type CicloForm = z.infer<typeof cicloSchema>;

// INTERFAZ DE CICLO
interface Ciclo {
  id: number;
  item: number;
  no_rqp: string;
  no_contrato: string;
  entidad_contratante: string;
  fecha_planeacion_inicial: string;
  fecha_planeacion_final: string;
  fecha_planeacion_dias: number;
  numero_menu_inicial: number;
  numero_menu_final: number;
  fecha_contrato_inicial: string;
  fecha_contrato_final: string;
  fecha_contrato_ejecucion: string;
  cantidad_servicios: number;
  valor_total: number;
  estado: "activo" | "inactivo" | "pendiente" | "ejecutado";
  created_at: string;
  updated_at: string;
}

const AnalisisCompraPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "activo" | "inactivo" | "pendiente" | "ejecutado">("activo");
  const [activeTab, setActiveTab] = useState("ciclos");
  const [editingCiclo, setEditingCiclo] = useState<Ciclo | null>(null);
  const [nextItemNumber, setNextItemNumber] = useState(3); // Para generar números consecutivos
  const { toast } = useToast();
  const { startLoading, stopLoading } = useLoading();
  const queryClient = useQueryClient();

  // Función para asignar colores diferentes a cada estado
  const getEstadoColor = (estado: string) => {
    const colors = {
      activo: "bg-green-50 text-green-700 border-green-200",
      inactivo: "bg-gray-50 text-gray-700 border-gray-200",
      pendiente: "bg-yellow-50 text-yellow-700 border-yellow-200",
      ejecutado: "bg-blue-50 text-blue-700 border-blue-200",
    };
    return colors[estado as keyof typeof colors] || colors.inactivo;
  };

  // Query para obtener ciclos (simulado por ahora)
  const { data: ciclos = [], isLoading, refetch } = useQuery<Ciclo[]>({
    queryKey: ["ciclos"],
    queryFn: async () => {
      // Simular datos para la demostración
      return [
        {
          id: 1,
          item: 1,
          no_rqp: "RQP-2024-001",
          no_contrato: "CT-2024-001",
          entidad_contratante: "Empresa ABC S.A.S",
          fecha_planeacion_inicial: "2024-01-15",
          fecha_planeacion_final: "2024-01-30",
          fecha_planeacion_dias: 15,
          numero_menu_inicial: 1,
          numero_menu_final: 28,
          fecha_contrato_inicial: "2024-02-01",
          fecha_contrato_final: "2024-02-28",
          fecha_contrato_ejecucion: "2024-02-01",
          cantidad_servicios: 500,
          valor_total: 25000000,
          estado: "activo",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          item: 2,
          no_rqp: "RQP-2024-002",
          no_contrato: "CT-2024-002",
          entidad_contratante: "Empresa XYZ Ltda",
          fecha_planeacion_inicial: "2024-02-01",
          fecha_planeacion_final: "2024-02-15",
          fecha_planeacion_dias: 14,
          numero_menu_inicial: 29,
          numero_menu_final: 59,
          fecha_contrato_inicial: "2024-03-01",
          fecha_contrato_final: "2024-03-31",
          fecha_contrato_ejecucion: "2024-03-01",
          cantidad_servicios: 300,
          valor_total: 15000000,
          estado: "pendiente",
          created_at: "2024-02-01T00:00:00Z",
          updated_at: "2024-02-01T00:00:00Z",
        },
      ];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Formulario para crear/editar ciclo
  const form = useForm<CicloForm>({
    resolver: zodResolver(cicloSchema),
    defaultValues: {
      item: nextItemNumber,
      no_rqp: "",
      no_contrato: "",
      entidad_contratante: "",
      fecha_planeacion_inicial: "",
      fecha_planeacion_final: "",
      fecha_planeacion_dias: 0,
      numero_menu_inicial: 0,
      numero_menu_final: 0,
      fecha_contrato_inicial: "",
      fecha_contrato_final: "",
      fecha_contrato_ejecucion: "",
      cantidad_servicios: 0,
      valor_total: 0,
      estado: "pendiente",
    },
  });

  // Mutaciones
  const createCicloMutation = useMutation({
    mutationFn: async (data: CicloForm) => {
      startLoading();
      try {
        // Simular creación de ciclo
        console.log("Creando ciclo:", data);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return data;
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      toast({
        title: "Ciclo creado",
        description: "El ciclo ha sido creado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["ciclos"] });
      setNextItemNumber(prev => prev + 1); // Incrementar número consecutivo
      form.reset({
        item: nextItemNumber + 1,
        no_rqp: "",
        no_contrato: "",
        entidad_contratante: "",
        fecha_planeacion_inicial: "",
        fecha_planeacion_final: "",
        fecha_planeacion_dias: 0,
        numero_menu_inicial: 0,
        numero_menu_final: 0,
        fecha_contrato_inicial: "",
        fecha_contrato_final: "",
        fecha_contrato_ejecucion: "",
        cantidad_servicios: 0,
        valor_total: 0,
        estado: "pendiente",
      });
      setActiveTab("ciclos");
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear ciclo",
        description: error.message || "Hubo un error al crear el ciclo",
        variant: "destructive",
      });
    },
  });

  const updateCicloMutation = useMutation({
    mutationFn: async (data: CicloForm & { id: number }) => {
      startLoading();
      try {
        // Simular actualización de ciclo
        console.log("Actualizando ciclo:", data);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return data;
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      toast({
        title: "Ciclo actualizado",
        description: "El ciclo ha sido actualizado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["ciclos"] });
      setEditingCiclo(null);
      setActiveTab("ciclos");
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar ciclo",
        description: error.message || "Hubo un error al actualizar el ciclo",
        variant: "destructive",
      });
    },
  });

  const deleteCicloMutation = useMutation({
    mutationFn: async (id: number) => {
      startLoading();
      try {
        // Simular eliminación de ciclo
        console.log("Eliminando ciclo:", id);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return id;
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      toast({
        title: "Ciclo eliminado",
        description: "El ciclo ha sido eliminado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["ciclos"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar ciclo",
        description: error.message || "Hubo un error al eliminar el ciclo",
        variant: "destructive",
      });
    },
  });

  // Filtrado de ciclos
  const ciclosFiltrados = useMemo(() => {
    return ciclos.filter(ciclo => {
      const term = (searchTerm || "").toLowerCase();
      const matchesSearch =
        (ciclo.item?.toString() || "").toLowerCase().includes(term) ||
        (ciclo.no_rqp || "").toLowerCase().includes(term) ||
        (ciclo.no_contrato || "").toLowerCase().includes(term) ||
        (ciclo.entidad_contratante || "").toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" ? true : ciclo.estado === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [ciclos, searchTerm, statusFilter]);

  // Handlers
  const handleEliminarCiclo = async (id: number) => {
    deleteCicloMutation.mutate(id);
  };

  const handleCrearCiclo = (data: CicloForm) => {
    if (editingCiclo) {
      updateCicloMutation.mutate({ ...data, id: editingCiclo.id });
    } else {
      createCicloMutation.mutate(data);
    }
  };

  const handleEditarCiclo = (ciclo: Ciclo) => {
    setEditingCiclo(ciclo);
    form.reset({
      item: ciclo.item,
      no_rqp: ciclo.no_rqp,
      no_contrato: ciclo.no_contrato,
      entidad_contratante: ciclo.entidad_contratante,
      fecha_planeacion_inicial: ciclo.fecha_planeacion_inicial,
      fecha_planeacion_final: ciclo.fecha_planeacion_final,
      fecha_planeacion_dias: ciclo.fecha_planeacion_dias,
      numero_menu_inicial: ciclo.numero_menu_inicial,
      numero_menu_final: ciclo.numero_menu_final,
      fecha_contrato_inicial: ciclo.fecha_contrato_inicial,
      fecha_contrato_final: ciclo.fecha_contrato_final,
      fecha_contrato_ejecucion: ciclo.fecha_contrato_ejecucion,
      cantidad_servicios: ciclo.cantidad_servicios,
      valor_total: ciclo.valor_total,
      estado: ciclo.estado,
    });
    setActiveTab("registro");
  };

  // Función para calcular días entre fechas
  const calcularDias = (fechaInicial: string, fechaFinal: string) => {
    const inicio = new Date(fechaInicial);
    const fin = new Date(fechaFinal);
    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // Efecto para calcular días automáticamente
  React.useEffect(() => {
    const fechaInicial = form.watch("fecha_planeacion_inicial");
    const fechaFinal = form.watch("fecha_planeacion_final");
    
    if (fechaInicial && fechaFinal) {
      const dias = calcularDias(fechaInicial, fechaFinal);
      form.setValue("fecha_planeacion_dias", dias);
    }
  }, [form.watch("fecha_planeacion_inicial"), form.watch("fecha_planeacion_final")]);

  return (
    <div className="p-4 w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <BarChart3 className="w-8 h-8 text-cyan-600" />
          Análisis de la Compra
        </h1>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="ciclos"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Listado de Ciclos
          </TabsTrigger>
          <TabsTrigger
            value="registro"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Nuevo Ciclo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ciclos" className="mt-6">
          {/* Header similar a perfiles */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">ANÁLISIS DE COMPRA</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    setEditingCiclo(null);
                    form.reset({
                      item: nextItemNumber,
                      no_rqp: "",
                      no_contrato: "",
                      entidad_contratante: "",
                      fecha_planeacion_inicial: "",
                      fecha_planeacion_final: "",
                      fecha_planeacion_dias: 0,
                      numero_menu_inicial: 0,
                      numero_menu_final: 0,
                      fecha_contrato_inicial: "",
                      fecha_contrato_final: "",
                      fecha_contrato_ejecucion: "",
                      cantidad_servicios: 0,
                      valor_total: 0,
                      estado: "pendiente",
                    });
                    setActiveTab("registro");
                  }}
                  className="bg-brand-lime hover:bg-brand-lime/90"
                  size="sm"
                >
                  Nuevo Ciclo
                </Button>
              </div>
            </div>

            {/* Filtros y búsqueda */}
            <div className="flex flex-wrap items-center gap-4 p-3 bg-cyan-50 rounded-lg mb-4 shadow-sm">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Buscar por item, RQP, contrato, entidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="min-w-[180px]">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "activo" | "inactivo" | "pendiente" | "ejecutado")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="ejecutado">Ejecutado</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabla de ciclos */}
            <div className="relative overflow-x-auto rounded-lg shadow-sm">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-20">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin h-10 w-10 text-cyan-600" />
                    <span className="text-cyan-700 font-semibold">Cargando ciclos...</span>
                  </div>
                </div>
              )}
              <Table className="min-w-[1200px] w-full text-xs">
                <TableHeader className="bg-cyan-50">
                  <TableRow className="text-left font-semibold text-gray-700">
                    <TableHead className="px-1 py-1 text-teal-600 w-16">Acciones</TableHead>
                    <TableHead className="px-2 py-2 w-16">Item</TableHead>
                    <TableHead className="px-2 py-2 w-24">No RQP</TableHead>
                    <TableHead className="px-2 py-2 w-28">No Contrato</TableHead>
                    <TableHead className="px-2 py-2 w-48">Entidad Contratante</TableHead>
                    <TableHead className="px-2 py-2 w-36">Fechas de Planeación</TableHead>
                    <TableHead className="px-2 py-2 w-24">Menús</TableHead>
                    <TableHead className="px-2 py-2 w-40">Fechas del Contrato</TableHead>
                    <TableHead className="px-2 py-2 w-32">Cantidades x Día</TableHead>
                    <TableHead className="px-2 py-2 w-32">Valores</TableHead>
                    <TableHead className="px-2 py-2 w-24">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isLoading && (ciclosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-24 text-center">
                        No hay ciclos disponibles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ciclosFiltrados.map((ciclo) => (
                      <TableRow key={ciclo.id} className="hover:bg-gray-50">
                        <TableCell className="px-1 py-1 w-16">
                          <div className="flex flex-row gap-1 items-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditarCiclo(ciclo)}
                                    aria-label="Editar ciclo"
                                  >
                                    <Edit className="h-5 w-5 text-cyan-600 hover:text-cyan-800 transition-colors" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <AlertDialog>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Eliminar ciclo"
                                      >
                                        <Trash2 className="h-5 w-5 text-rose-600 hover:text-rose-800 transition-colors" />
                                      </Button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Eliminar</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar ciclo?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Estás seguro de que deseas eliminar permanentemente el ciclo{" "}
                                    <strong>{ciclo.item}</strong>?
                                    Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleEliminarCiclo(ciclo.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-16">
                          {ciclo.item}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-24">
                          {ciclo.no_rqp}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-28">
                          {ciclo.no_contrato}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-48">
                          {ciclo.entidad_contratante}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-36">
                          <div className="space-y-0.5">
                            <div><strong>Inicial:</strong> {new Date(ciclo.fecha_planeacion_inicial).toLocaleDateString()}</div>
                            <div><strong>Final:</strong> {new Date(ciclo.fecha_planeacion_final).toLocaleDateString()}</div>
                            <div><strong>Días:</strong> {ciclo.fecha_planeacion_dias}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-24">
                          <div className="space-y-0.5">
                            <div><strong>Inicial:</strong> {ciclo.numero_menu_inicial}</div>
                            <div><strong>Final:</strong> {ciclo.numero_menu_final}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-40">
                          <div className="space-y-0.5">
                            <div><strong>Inicial:</strong> {new Date(ciclo.fecha_contrato_inicial).toLocaleDateString()}</div>
                            <div><strong>Final:</strong> {new Date(ciclo.fecha_contrato_final).toLocaleDateString()}</div>
                            <div><strong>Ejecución:</strong> {new Date(ciclo.fecha_contrato_ejecucion).toLocaleDateString()}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-32">
                          <div className="space-y-0.5">
                            <div><strong>Servicios:</strong> {ciclo.cantidad_servicios}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-right w-32">
                          <div className="space-y-0.5">
                            <div><strong>Total:</strong> ${ciclo.valor_total.toLocaleString()}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-left w-24">
                          <Badge
                            variant="outline"
                            className={getEstadoColor(ciclo.estado)}
                          >
                            {ciclo.estado.charAt(0).toUpperCase() + ciclo.estado.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="registro" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCrearCiclo)} className="space-y-6">
                  {/* Información General */}
                  <div className="p-4 border rounded-lg bg-slate-50 mb-4">
                    <h3 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-cyan-600" />
                      Información General
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="item"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Número de item" 
                                {...field} 
                                readOnly={!editingCiclo}
                                className={!editingCiclo ? "bg-gray-100" : ""}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="no_rqp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>No RQP *</FormLabel>
                            <FormControl>
                              <Input placeholder="Número RQP" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="no_contrato"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>No Contrato *</FormLabel>
                            <FormControl>
                              <Input placeholder="Número de contrato" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="entidad_contratante"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Entidad Contratante *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre de la entidad" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Fechas de Planeación */}
                  <div className="p-4 border rounded-lg bg-slate-50 mb-4">
                    <h3 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-cyan-600" />
                      Fechas de Planeación
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="fecha_planeacion_inicial"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha Inicial *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fecha_planeacion_final"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha Final *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fecha_planeacion_dias"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Días *</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} readOnly />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Números de Menús */}
                  <div className="p-4 border rounded-lg bg-slate-50 mb-4">
                    <h3 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-cyan-600" />
                      Números de Menús
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="numero_menu_inicial"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número Inicial *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Número inicial del menú" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="numero_menu_final"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número Final *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Número final del menú" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Fechas del Contrato */}
                  <div className="p-4 border rounded-lg bg-slate-50 mb-4">
                    <h3 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-cyan-600" />
                      Fechas del Contrato
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="fecha_contrato_inicial"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha Inicial *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fecha_contrato_final"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha Final *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fecha_contrato_ejecucion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de Ejecución *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Cantidades y Valores */}
                  <div className="p-4 border rounded-lg bg-cyan-50 mt-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-cyan-600" />
                      Cantidades y Valores
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="cantidad_servicios"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cantidad de Servicios *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Cantidad" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="valor_total"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Total *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Valor total" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="estado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pendiente">Pendiente</SelectItem>
                                <SelectItem value="activo">Activo</SelectItem>
                                <SelectItem value="ejecutado">Ejecutado</SelectItem>
                                <SelectItem value="inactivo">Inactivo</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setActiveTab("ciclos");
                        setEditingCiclo(null);
                        form.reset();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="bg-brand-lime hover:bg-brand-lime/90 text-white border-0 shadow-sm px-6 py-2 rounded text-sm font-medium transition-colors"
                      disabled={createCicloMutation.isPending}
                    >
                      {createCicloMutation.isPending ?
                        (editingCiclo ? 'Actualizando...' : 'Guardando...') :
                        (editingCiclo ? 'Actualizar' : 'Guardar')
                      }
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalisisCompraPage;

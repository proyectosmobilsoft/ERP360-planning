import { Company } from "@/types/company";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BusinessEntityRowProps {
  entity: Company;
  cityData: Record<number, { nombre: string; ciudades: { id: number; nombre: string }[] }>;
  onEdit: (entity: Company) => void;
  onDelete: (entity: Company) => void;
  entityType: 'empresa' | 'prestador';
}

export function BusinessEntityRow({
  entity,
  cityData,
  onEdit,
  onDelete,
  entityType,
}: BusinessEntityRowProps) {
  const getCityName = (cityId: string | number) => {
    if (!cityId) return '';
    // cityData es { [idDepartamento]: { nombre, ciudades: [{id, nombre}] } }
    for (const dep of Object.values(cityData)) {
      if (dep && dep.ciudades && Array.isArray(dep.ciudades)) {
        const ciudad = dep.ciudades.find((c: any) => String(c.id) === String(cityId));
        if (ciudad) return ciudad.nombre;
      }
    }
    return String(cityId);
  };

  return (
    <TableRow key={entity.id} className="text-[11px]">
      <TableCell className="py-1 px-2 whitespace-nowrap">{entity.nit}</TableCell>
      <TableCell className="py-1 px-2 font-medium whitespace-nowrap">{entity.razonSocial}</TableCell>
      <TableCell className="py-1 px-2 whitespace-nowrap">{entity.direccion}</TableCell>
      <TableCell className="py-1 px-2 whitespace-nowrap">{getCityName(entity.ciudad || '')}</TableCell>
      <TableCell className="py-1 px-2 whitespace-nowrap">{entity.correoElectronico}</TableCell>
      <TableCell className="py-1 px-2 whitespace-nowrap">{entity.telefono}</TableCell>
      <TableCell className="py-1 px-2 whitespace-nowrap">{entity.representanteLegal}</TableCell>
      <TableCell className="py-1 px-2 whitespace-nowrap">
        <Badge 
          variant={entity.active ? "default" : "destructive"}
          className="text-[10px] px-1.5 py-0"
        >
          {entity.active ? "Activo" : "Inactivo"}
        </Badge>
      </TableCell>
      <TableCell className="text-right py-1 px-2 whitespace-nowrap">
        <div className="flex justify-end gap-0.5">
          <Button variant="ghost" size="sm" onClick={() => onEdit(entity)} className="h-6 w-6">
            <Pencil className="h-3 w-3" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6">
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente {entityType === 'empresa' ? 'la empresa' : 'el prestador'} {entity.razonSocial} y todos sus documentos asociados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(entity)}>
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}
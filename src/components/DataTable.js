/**
 * SERMA - Tabla de Datos Component
 * Componente reutilizable para mostrar datos en tabla
 */

import React from 'react';
import { Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * DataTable - Componente de tabla
 * @param {Object} props - Propiedades
 * @param {Array} props.columns - Columnas [{label, key}]
 * @param {Array} props.data - Datos a mostrar
 * @param {Function} props.onEdit - Callback para editar
 * @param {Function} props.onDelete - Callback para eliminar
 * @param {boolean} props.loading - Estado de carga
 * @param {boolean} props.pagination - Mostrar paginación
 * @param {number} props.pageSize - Registros por página
 */
export const DataTable = ({
  columns,
  data,
  onEdit,
  onDelete,
  loading = false,
  pagination = true,
  pageSize = 10,
}) => {
  const [currentPage, setCurrentPage] = React.useState(0);

  const startIdx = currentPage * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedData = data.slice(startIdx, endIdx);
  const totalPages = Math.ceil(data.length / pageSize);

  const handlePreviousPage = () => {
    setCurrentPage(Math.max(0, currentPage - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(Math.min(totalPages - 1, currentPage + 1));
  };

  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando...</div>
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">No hay datos disponibles</div>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {columns.map((column) => (
                  <th key={column.key} className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    {column.label}
                  </th>
                ))}
                {(onEdit || onDelete) && (
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => {
                const rowKey = row.id || row.documentId || `row-${startIdx + index}`;
                return (
                  <tr key={rowKey} className="border-b border-gray-200 hover:bg-gray-50">
                    {columns.map((column) => (
                      <td key={`${rowKey}-${column.key}`} className="px-6 py-4 text-sm text-gray-900">
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          {onEdit && (
                            <button onClick={() => onEdit(row)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button onClick={() => onDelete(row)} className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {pagination && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {startIdx + 1} a {Math.min(endIdx, data.length)} de {data.length} registros
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 0}
              className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`px-3 py-1 rounded text-sm ${
                    currentPage === i
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1}
              className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;

import React, { useEffect, useRef, useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { deleteGuardian, getAllGuardians, importGuardians, updateGuardian } from '../services/guardianService';
import { mysqlRequest } from '../services/mysqlApi';
import { getAllStudents } from '../services/studentService';

const normalizeHeader = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const buildSummaryFallback = (guardianData = [], studentData = []) => ({
  totalUsers: guardianData.length + studentData.length,
  students: studentData.length,
  teachers: null,
  guardianLinks: guardianData.length,
});

export const GuardiansImportModule = () => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState(null);
  const [guardians, setGuardians] = useState([]);
  const [students, setStudents] = useState([]);
  const [editingGuardian, setEditingGuardian] = useState(null);
  const [guardianSearch, setGuardianSearch] = useState('');
  const [savingGuardian, setSavingGuardian] = useState(false);

  useEffect(() => {
    let active = true;
    const loadSummary = async () => {
      try {
        const data = await mysqlRequest('/api/rector/resumen');
        if (active) setSummary(data);
        return data;
      } catch (error) {
        if (active) setSummaryError(error.message || 'No se pudo cargar el resumen del rector');
        return null;
      }
    };

    const loadGuardians = async () => {
      try {
        const guardianData = await getAllGuardians();
        if (active) setGuardians(guardianData || []);
        return guardianData || [];
      } catch (error) {
        if (active) setMessage({ type: 'error', text: error.message || 'No se pudieron cargar los padres de familia.' });
        return [];
      }
    };

    const loadStudents = async () => {
      try {
        const studentData = await getAllStudents();
        if (active) setStudents(studentData || []);
        return studentData || [];
      } catch (error) {
        if (active) setMessage({ type: 'error', text: error.message || 'No se pudieron cargar los estudiantes.' });
        return [];
      }
    };

    Promise.all([loadSummary(), loadGuardians(), loadStudents()]).then(([summaryData, guardianData, studentData]) => {
      if (!active) return;
      if (!summaryData) {
        setSummary(buildSummaryFallback(guardianData, studentData));
      }
    });
    return () => { active = false; };
  }, []);

  const refreshGuardians = async () => {
    setGuardians(await getAllGuardians());
  };

  const saveGuardian = async (event) => {
    event.preventDefault();
    setSavingGuardian(true);
    try {
      await updateGuardian(editingGuardian.id, editingGuardian);
      await refreshGuardians();
      setEditingGuardian(null);
      setMessage({ type: 'success', text: 'Datos del padre actualizados correctamente.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'No se pudo actualizar el padre.' });
    } finally {
      setSavingGuardian(false);
    }
  };

  const removeGuardian = async (guardian) => {
    if (!window.confirm(`¿Eliminar el vínculo de ${guardian.firstName} ${guardian.lastName}? La cuenta de usuario no se eliminará.`)) return;
    try {
      await deleteGuardian(guardian.id);
      await refreshGuardians();
      setMessage({ type: 'success', text: 'Vínculo eliminado correctamente.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'No se pudo eliminar el vínculo.' });
    }
  };

  const visibleGuardians = guardians.filter((guardian) => {
    const term = guardianSearch.trim().toLowerCase();
    if (!term) return true;
    return `${guardian.firstName} ${guardian.lastName} ${guardian.email} ${guardian.studentDocumentId}`.toLowerCase().includes(term);
  });

  const processFile = async (file) => {
    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setMessage({ type: 'error', text: 'Selecciona un archivo Excel (.xlsx o .xls).' });
      return;
    }

    setImporting(true);
    setMessage(null);
    setCredentials([]);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '', raw: false });
      if (!rows.length) throw new Error('El archivo está vacío');

      const headers = rows[0].map(normalizeHeader);
      const findHeader = (...names) => headers.findIndex((header) => names.includes(header));
      const findHeaderAfter = (startIndex, ...names) => headers.findIndex(
        (header, index) => index > startIndex && names.includes(header)
      );
      const studentDocumentIndex = findHeader('estudiante id', 'documento estudiante', 'documento del estudiante');
      const parentFullNameIndex = findHeader('nombre del padre', 'nombre padre', 'nombre acudiente', 'nombre del acudiente');
      const emailIndex = findHeader('correo', 'email', 'correo electronico');
      const phoneIndex = findHeader('telefono', 'celular', 'telefono padre', 'telefono acudiente');
      const passwordIndex = findHeader('contrasena', 'password', 'clave');
      const parentFirstNameIndex = findHeaderAfter(
        parentFullNameIndex,
        'nombre del padre',
        'nombre padre',
        'nombre acudiente',
        'nombre del acudiente',
        'nombre'
      );
      const parentLastNameIndex = findHeaderAfter(
        parentFullNameIndex,
        'apellido del padre',
        'apellido padre',
        'apellido acudiente',
        'apellido del acudiente',
        'apellido'
      );

      if ([studentDocumentIndex, emailIndex].some((index) => index < 0)) {
        throw new Error('Faltan las columnas “Estudiante (ID)” y “Correo” en la primera fila');
      }

      const importedRows = rows.slice(1).map((row) => {
        const fullName = String(parentFullNameIndex >= 0 ? row[parentFullNameIndex] : '').trim();
        const parts = fullName.split(/\s+/).filter(Boolean);
        const firstName = String(parentFirstNameIndex >= 0 ? row[parentFirstNameIndex] : '').trim();
        const lastName = String(parentLastNameIndex >= 0 ? row[parentLastNameIndex] : '').trim();
        return {
          studentDocumentId: String(row[studentDocumentIndex] || '').trim(),
          firstName: firstName || parts[0] || '',
          lastName: lastName || parts.slice(1).join(' ') || '',
          email: String(row[emailIndex] || '').trim(),
          phone: String(phoneIndex >= 0 ? row[phoneIndex] : '').trim(),
          password: passwordIndex >= 0 ? String(row[passwordIndex] || '').trim() : '',
        };
      }).filter((row) => Object.values(row).some(Boolean));

      const result = await importGuardians(importedRows);
      setCredentials(result.results.filter((item) => item.temporaryPassword));
      setMessage({
        type: result.errors ? 'warning' : 'success',
        text: `Importación terminada: ${result.created} cuentas creadas, ${result.linked} vínculos existentes y ${result.errors} errores.`,
        errors: result.results.filter((item) => item.status === 'error'),
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'No se pudo importar el archivo.' });
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    processFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Padres de familia</h2>
        <p className="mt-1 text-sm text-gray-600">Consulta los indicadores y registra acudientes desde un archivo Excel.</p>
      </div>

      <div className="w-full rounded-xl bg-white shadow">
        <div className="border-b px-6 py-4">
          <h3 className="text-xl font-bold text-gray-900">Registrar padres de familia</h3>
          <p className="text-sm text-gray-500">Importa los acudientes desde un archivo Excel</p>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="mb-3 text-base font-semibold text-gray-900">Resumen para el rector</h3>
            {summaryError && <p className="mb-3 text-sm text-red-600">{summaryError}</p>}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ['Usuarios', summary?.totalUsers, 'text-blue-700'],
                ['Estudiantes', summary?.students, 'text-indigo-700'],
                ['Docentes', summary?.teachers, 'text-emerald-700'],
                ['Padres vinculados', summary?.guardianLinks, 'text-orange-700'],
              ].map(([label, value, color]) => (
                <div key={label} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className={`mt-1 text-xl font-bold ${color}`}>{value == null ? '—' : value}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Estos indicadores ayudan a revisar cobertura de usuarios, vinculación familiar y alertas de rendimiento.
            </p>
          </div>

          <div
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
              dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              disabled={importing}
              onChange={(event) => processFile(event.target.files?.[0])}
            />
            <Upload className="mx-auto mb-3 h-10 w-10 text-blue-600" />
            <p className="font-semibold text-gray-800">
              {importing ? 'Procesando archivo...' : 'Arrastra el archivo aquí'}
            </p>
            <p className="mt-1 text-sm text-gray-500">o haz clic para seleccionarlo desde tu equipo</p>
            <p className="mt-3 text-xs text-gray-400">Formatos permitidos: .xlsx y .xls</p>
          </div>

          <div className="mt-4 flex gap-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
            <FileSpreadsheet className="h-5 w-5 shrink-0" />
            <p>El Excel debe incluir “Estudiante (ID)” y “Correo”. También puede incluir “Nombre del padre”, “Nombre”, “Apellido”, “telefono” y “contraseña”.</p>
          </div>

          <div className="mt-8 border-t pt-6">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Padres registrados</h3>
                <p className="text-sm text-gray-500">Edita sus datos directamente desde esta tabla.</p>
              </div>
              <input
                value={guardianSearch}
                onChange={(event) => setGuardianSearch(event.target.value)}
                placeholder="Buscar padre, correo o estudiante"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            {editingGuardian && (
              <form onSubmit={saveGuardian} className="mb-5 grid grid-cols-1 gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 md:grid-cols-2">
                {[
                  ['firstName', 'Nombre'],
                  ['lastName', 'Apellido'],
                  ['email', 'Correo', 'email'],
                  ['phone', 'Teléfono'],
                  ['relationship', 'Parentesco'],
                  ['password', 'Nueva contraseña', 'password'],
                ].map(([name, label, type]) => (
                  <label key={name} className="text-sm font-medium text-gray-700">
                    {label}
                    <input
                      type={type || 'text'}
                      required={['firstName', 'lastName', 'email'].includes(name)}
                      value={editingGuardian[name] || ''}
                      onChange={(event) => setEditingGuardian({ ...editingGuardian, [name]: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal"
                    />
                  </label>
                ))}
                <label className="text-sm font-medium text-gray-700">
                  Estudiante vinculado
                  <select
                    required
                    value={editingGuardian.studentId || ''}
                    onChange={(event) => setEditingGuardian({ ...editingGuardian, studentId: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal"
                  >
                    <option value="">Seleccionar estudiante</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} - {student.documentId}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-end gap-2">
                  <button type="submit" disabled={savingGuardian} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                    {savingGuardian ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button type="button" onClick={() => setEditingGuardian(null)} className="rounded-lg bg-gray-200 px-4 py-2 text-sm">
                    Cancelar
                  </button>
                </div>
              </form>
            )}
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr><th className="px-3 py-3">Padre</th><th>Correo</th><th>Teléfono</th><th>Parentesco</th><th>Estudiante</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {visibleGuardians.map((guardian) => (
                    <tr key={guardian.id} className="border-t">
                      <td className="px-3 py-3">{guardian.firstName} {guardian.lastName}</td>
                      <td>{guardian.email}</td>
                      <td>{guardian.phone || '—'}</td>
                      <td>{guardian.relationship || '—'}</td>
                      <td>{guardian.studentName}<div className="text-xs text-gray-500">{guardian.studentDocumentId}</div></td>
                      <td className="whitespace-nowrap">
                        <button type="button" onClick={() => setEditingGuardian({ ...guardian })} className="mr-3 text-blue-600 hover:underline">Editar</button>
                        <button type="button" onClick={() => removeGuardian(guardian)} className="text-red-600 hover:underline">Eliminar vínculo</button>
                      </td>
                    </tr>
                  ))}
                  {!visibleGuardians.length && <tr><td colSpan="6" className="px-3 py-6 text-center text-gray-500">No hay padres registrados.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {message && (
            <div className={`mt-4 rounded-lg p-3 text-sm ${
              message.type === 'error' ? 'bg-red-50 text-red-700' :
                message.type === 'warning' ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-700'
            }`}>
              <div>{message.text}</div>
              {message.errors?.length > 0 && (
                <ul className="mt-2 list-inside list-disc">
                  {message.errors.map((item) => <li key={item.row}>Fila {item.row}: {item.message}</li>)}
                </ul>
              )}
            </div>
          )}

          {credentials.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <p className="mb-2 text-sm font-semibold text-gray-700">Contraseñas temporales generadas</p>
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left"><th className="py-2">Correo</th><th>Contraseña</th></tr></thead>
                <tbody>{credentials.map((item) => (
                  <tr key={`${item.row}-${item.email}`} className="border-b">
                    <td className="py-2">{item.email}</td><td>{item.temporaryPassword}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuardiansImportModule;

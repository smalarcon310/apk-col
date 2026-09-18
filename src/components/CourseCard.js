import React from 'react';
const CourseCard = ({ id, name, code, teacherName, onSelect, showActions = false }) => {
  return (
    <div
      onClick={() => onSelect && onSelect(id)}
      className="bg-white p-3 rounded shadow mb-3 cursor-pointer"
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="font-semibold text-gray-800">{name}</div>
          <div className="text-xs text-gray-500">Curso: {code || id}{teacherName ? ` • ${teacherName}` : ''}</div>
        </div>
        {showActions && (
          <div>
            <button
              onClick={(e) => { e.stopPropagation(); onSelect && onSelect(id); }}
              className="px-3 py-1 border rounded text-sm"
            >
              Registrar Avances
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard;

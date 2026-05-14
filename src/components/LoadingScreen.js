/**
 * LoadingScreen - Pantalla de carga con logo SERMA
 */
import React from 'react';
import getAssetPath from '../utils/assetPath';

export const LoadingScreen = ({ size = 'full' }) => {
  const isCompact = size === 'compact';
  const containerClass = isCompact
    ? 'flex items-center justify-center bg-white py-10'
    : 'min-h-screen flex items-center justify-center bg-white';
  
  const svgSize = isCompact ? '120' : '240';
  const svgViewBox = '0 0 240 240';
  const divSize = isCompact ? 'h-32 w-32' : 'h-64 w-64';
  const logoSize = isCompact ? 'w-12 h-12' : 'w-24 h-24';
  const fontSize = isCompact ? 'text-xs' : 'text-sm';
  const textSize = isCompact ? 'text-base' : 'text-lg';
  return (
    <div className={containerClass}>
      <style>{`
        @keyframes rotate-loader {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .loader-circle {
          animation: rotate-loader 3s linear infinite;
        }

        @keyframes dash {
          0% {
            stroke-dashoffset: 1000;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        .loader-dash {
          animation: dash 2s ease-in-out infinite;
        }
      `}</style>

      <div className="text-center">
        {/* SVG Loader con círculo y líneas */}
        <div className={`mb-6 relative flex justify-center items-center ${divSize}`}>
          <svg
            width={svgSize}
            height={svgSize}
            viewBox={svgViewBox}
            className="loader-circle absolute"
          >
            <circle
              cx="120"
              cy="120"
              r="100"
              fill="none"
              stroke="#2a8a99"
              strokeWidth="3"
              strokeDasharray="100,50"
              className="loader-dash"
              opacity="0.6"
            />
            <circle
              cx="120"
              cy="120"
              r="90"
              fill="none"
              stroke="#2a8a99"
              strokeWidth="2"
              opacity="0.4"
            />
          </svg>

          {/* Logo en el centro */}
          <div className="absolute flex flex-col items-center">
            <img
              src={getAssetPath('logo 1.png')}
              alt="SERMA"
              className={`${logoSize} object-contain mb-2`}
            />
            <span className={`${fontSize} text-gray-800 font-bold`}>SERMA</span>
          </div>
        </div>

        {/* Texto de carga */}
        <p className={`${textSize} text-gray-800 font-semibold`}>Cargando...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;

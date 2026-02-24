import React, { useCallback, useRef, useState } from 'react';
import { TEMPLATE_VARIABLES } from '@/constants/templateVariables';

export interface OverlayFieldData {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  variable: string;
  custom_text: string;
  font_size: number;
  font_family: string;
  color: string;
  alignment: string;
}

interface OverlayFieldRectProps {
  field: OverlayFieldData;
  scale: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<OverlayFieldData>) => void;
  onDelete: (id: string) => void;
}

function getVariableLabel(variable: string): string {
  const [prefix, campo] = variable.split('.', 2);
  if (!prefix || !campo) return variable || 'Clique para definir';
  for (const group of TEMPLATE_VARIABLES) {
    if (group.prefixo === prefix) {
      const found = group.campos.find((c) => c.campo === campo);
      if (found) return found.label;
    }
  }
  return variable;
}

export const OverlayFieldRect: React.FC<OverlayFieldRectProps> = ({
  field,
  scale,
  selected,
  onSelect,
  onUpdate,
}) => {
  const rectRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<string | null>(null);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, fieldX: 0, fieldY: 0, fieldW: 0, fieldH: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(field.id);

      // Check if clicking on a resize handle
      const target = e.target as HTMLElement;
      const handleDir = target.dataset.resizeHandle;
      if (handleDir) {
        setResizing(handleDir);
        dragStart.current = {
          mouseX: e.clientX,
          mouseY: e.clientY,
          fieldX: field.x,
          fieldY: field.y,
          fieldW: field.width,
          fieldH: field.height,
        };
        e.preventDefault();
        return;
      }

      // Otherwise start dragging
      setDragging(true);
      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        fieldX: field.x,
        fieldY: field.y,
        fieldW: field.width,
        fieldH: field.height,
      };
      e.preventDefault();
    },
    [field, onSelect],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const dx = (e.clientX - dragStart.current.mouseX) / scale;
      const dy = (e.clientY - dragStart.current.mouseY) / scale;

      if (dragging) {
        onUpdate(field.id, {
          x: Math.max(0, dragStart.current.fieldX + dx),
          y: Math.max(0, dragStart.current.fieldY + dy),
        });
      } else if (resizing) {
        let newX = dragStart.current.fieldX;
        let newY = dragStart.current.fieldY;
        let newW = dragStart.current.fieldW;
        let newH = dragStart.current.fieldH;

        if (resizing.includes('e')) newW = Math.max(30, dragStart.current.fieldW + dx);
        if (resizing.includes('s')) newH = Math.max(14, dragStart.current.fieldH + dy);
        if (resizing.includes('w')) {
          newW = Math.max(30, dragStart.current.fieldW - dx);
          newX = dragStart.current.fieldX + dx;
        }
        if (resizing.includes('n')) {
          newH = Math.max(14, dragStart.current.fieldH - dy);
          newY = dragStart.current.fieldY + dy;
        }

        onUpdate(field.id, { x: newX, y: newY, width: newW, height: newH });
      }
    },
    [dragging, resizing, field.id, scale, onUpdate],
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    setResizing(null);
  }, []);

  // Attach global mouse listeners when dragging/resizing
  React.useEffect(() => {
    if (dragging || resizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, resizing, handleMouseMove, handleMouseUp]);

  const label = field.variable
    ? getVariableLabel(field.variable)
    : field.custom_text || 'Clique para definir';

  const isTextField = !field.variable && !!field.custom_text;
  const isEmpty = !field.variable && !field.custom_text;

  return (
    <div
      ref={rectRef}
      onMouseDown={handleMouseDown}
      className={`absolute cursor-move select-none flex items-center overflow-hidden ${
        selected
          ? isEmpty ? 'border-2 border-gray-400 bg-gray-50/60' : isTextField ? 'border-2 border-green-500 bg-green-50/60' : 'border-2 border-blue-500 bg-blue-50/60'
          : isEmpty ? 'border border-dashed border-gray-400 bg-gray-50/40 hover:bg-gray-50/60' : isTextField ? 'border border-dashed border-green-400 bg-green-50/40 hover:bg-green-50/60' : 'border border-dashed border-blue-400 bg-blue-50/40 hover:bg-blue-50/60'
      }`}
      style={{
        left: field.x * scale,
        top: field.y * scale,
        width: field.width * scale,
        height: field.height * scale,
        fontSize: Math.max(9, field.font_size * scale * 0.7),
        zIndex: selected ? 20 : 10,
      }}
    >
      <span
        className={`px-1 truncate w-full font-medium pointer-events-none ${
          isEmpty ? 'text-gray-400' : isTextField ? 'text-green-700' : 'text-blue-700'
        }`}
        style={{
          textAlign: field.alignment as any,
        }}
      >
        {label}
      </span>

      {/* Resize handles - only shown when selected */}
      {selected && (
        <>
          {['nw', 'ne', 'sw', 'se'].map((dir) => (
            <div
              key={dir}
              data-resize-handle={dir}
              className="absolute w-2.5 h-2.5 bg-blue-500 border border-white rounded-sm"
              style={{
                cursor: `${dir}-resize`,
                ...(dir.includes('n') ? { top: -4 } : { bottom: -4 }),
                ...(dir.includes('w') ? { left: -4 } : { right: -4 }),
              }}
            />
          ))}
          {['n', 's', 'e', 'w'].map((dir) => (
            <div
              key={dir}
              data-resize-handle={dir}
              className="absolute bg-blue-500 border border-white rounded-sm"
              style={{
                cursor: `${dir === 'n' || dir === 's' ? 'ns' : 'ew'}-resize`,
                ...(dir === 'n' ? { top: -4, left: '50%', marginLeft: -4, width: 8, height: 5 } : {}),
                ...(dir === 's' ? { bottom: -4, left: '50%', marginLeft: -4, width: 8, height: 5 } : {}),
                ...(dir === 'e' ? { right: -4, top: '50%', marginTop: -4, width: 5, height: 8 } : {}),
                ...(dir === 'w' ? { left: -4, top: '50%', marginTop: -4, width: 5, height: 8 } : {}),
              }}
            />
          ))}
        </>
      )}
    </div>
  );
};

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { OverlayFieldRect, OverlayFieldData } from './OverlayFieldRect';
import { FieldPropertiesPanel } from './FieldPropertiesPanel';
import api from '@/services/api';

// PDF points are 72 dpi, we render at 150 dpi
const RENDER_DPI = 150;
const PDF_DPI = 72;
const SCALE = RENDER_DPI / PDF_DPI;

interface PageInfo {
  page: number;
  width: number;
  height: number;
}

interface PdfOverlayEditorProps {
  templateId: number | null;
  pagesInfo: PageInfo[];
  fields: OverlayFieldData[];
  onFieldsChange: (fields: OverlayFieldData[]) => void;
  /** Pre-rendered page images from import (data URLs). Used when template not yet saved. */
  importedPageImages?: Record<number, string> | null;
}

export const PdfOverlayEditor: React.FC<PdfOverlayEditorProps> = ({
  templateId,
  pagesInfo,
  fields,
  onFieldsChange,
  importedPageImages,
}) => {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [pageImages, setPageImages] = useState<Record<number, string>>({});
  const [loadingPages, setLoadingPages] = useState<Set<number>>(new Set());
  const blobUrlsRef = useRef<string[]>([]);

  // Use imported images immediately when available
  useEffect(() => {
    if (importedPageImages && Object.keys(importedPageImages).length > 0) {
      setPageImages(importedPageImages);
    }
  }, [importedPageImages]);

  // Load page images from API for saved templates (only if no imported images)
  useEffect(() => {
    if (!templateId || pagesInfo.length === 0) return;
    // Skip if we already have all images (e.g. from import)
    const allLoaded = pagesInfo.every((pi) => pageImages[pi.page]);
    if (allLoaded) return;

    pagesInfo.forEach((pi) => {
      if (pageImages[pi.page] || loadingPages.has(pi.page)) return;

      setLoadingPages((prev) => new Set(prev).add(pi.page));

      api
        .get(`/documento-templates/${templateId}/pdf-page/${pi.page}?dpi=${RENDER_DPI}`, {
          responseType: 'blob',
        })
        .then((res) => {
          const url = URL.createObjectURL(res.data);
          blobUrlsRef.current.push(url);
          setPageImages((prev) => ({ ...prev, [pi.page]: url }));
        })
        .catch((err) => {
          console.error(`Failed to load page ${pi.page}:`, err);
        })
        .finally(() => {
          setLoadingPages((prev) => {
            const next = new Set(prev);
            next.delete(pi.page);
            return next;
          });
        });
    });
  }, [templateId, pagesInfo]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    const urls = blobUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handlePageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, pageNum: number) => {
      const target = e.target as HTMLElement;
      if (target !== e.currentTarget) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / SCALE;
      const y = (e.clientY - rect.top) / SCALE;

      const newField: OverlayFieldData = {
        id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        page: pageNum,
        x: Math.max(0, x - 50),
        y: Math.max(0, y - 8),
        width: 100,
        height: 16,
        variable: '',
        custom_text: '',
        font_size: 12,
        font_family: 'Helvetica',
        color: '#000000',
        alignment: 'left',
      };

      onFieldsChange([...fields, newField]);
      setSelectedFieldId(newField.id);
    },
    [fields, onFieldsChange],
  );

  const handleFieldUpdate = useCallback(
    (id: string, updates: Partial<OverlayFieldData>) => {
      onFieldsChange(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    },
    [fields, onFieldsChange],
  );

  const handleFieldDelete = useCallback(
    (id: string) => {
      onFieldsChange(fields.filter((f) => f.id !== id));
      if (selectedFieldId === id) setSelectedFieldId(null);
    },
    [fields, onFieldsChange, selectedFieldId],
  );

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null;

  // Handle variable drag-drop from sidebar
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, pageNum: number) => {
      e.preventDefault();
      const data = e.dataTransfer.getData('application/template-variable');
      if (!data) return;

      try {
        const { variablePath } = JSON.parse(data);
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / SCALE;
        const y = (e.clientY - rect.top) / SCALE;

        const newField: OverlayFieldData = {
          id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          page: pageNum,
          x: Math.max(0, x - 50),
          y: Math.max(0, y - 8),
          width: 120,
          height: 16,
          variable: variablePath,
          custom_text: '',
          font_size: 12,
          font_family: 'Helvetica',
          color: '#000000',
          alignment: 'left',
        };

        onFieldsChange([...fields, newField]);
        setSelectedFieldId(newField.id);
      } catch {
        // ignore invalid drag data
      }
    },
    [fields, onFieldsChange],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  return (
    <div className="flex h-full">
      {/* PDF pages area */}
      <div className="flex-1 min-w-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-4 flex flex-col items-center">
            {pagesInfo.map((pi) => (
              <div key={pi.page} className="relative shadow-lg bg-white">
                {/* Page number label */}
                <div className="absolute -top-5 left-0 text-xs text-gray-400">
                  Página {pi.page + 1}
                </div>

                {/* Page container */}
                <div
                  className="relative cursor-crosshair"
                  style={{
                    width: pi.width * SCALE,
                    height: pi.height * SCALE,
                  }}
                  onClick={(e) => handlePageClick(e, pi.page)}
                  onDrop={(e) => handleDrop(e, pi.page)}
                  onDragOver={handleDragOver}
                >
                  {/* PDF page image */}
                  {pageImages[pi.page] ? (
                    <img
                      src={pageImages[pi.page]}
                      alt={`Página ${pi.page + 1}`}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      draggable={false}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  )}

                  {/* Overlay fields for this page */}
                  {fields
                    .filter((f) => f.page === pi.page)
                    .map((field) => (
                      <OverlayFieldRect
                        key={field.id}
                        field={field}
                        scale={SCALE}
                        selected={field.id === selectedFieldId}
                        onSelect={setSelectedFieldId}
                        onUpdate={handleFieldUpdate}
                        onDelete={handleFieldDelete}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Properties panel */}
      <div className="w-56 border-l bg-white flex-shrink-0 overflow-y-auto">
        <FieldPropertiesPanel
          field={selectedField}
          onUpdate={handleFieldUpdate}
          onDelete={handleFieldDelete}
        />
      </div>
    </div>
  );
};

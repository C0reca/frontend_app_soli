
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X, Maximize2, Minimize2 as RestoreIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[100] bg-black/80 pointer-events-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-[100] grid w-fit min-w-[min(400px,90vw)] max-w-[90vw] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 pointer-events-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

// ── Resizable Dialog Content ──────────────────────────────────────────

interface ResizableDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  defaultWidth?: number
  defaultHeight?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  /** Storage key to persist size between sessions */
  storageKey?: string
}

const HANDLE_SIZE = 8

const ResizableDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ResizableDialogContentProps
>(
  (
    {
      className,
      children,
      defaultWidth,
      defaultHeight,
      minWidth = 360,
      minHeight = 300,
      maxWidth,
      maxHeight,
      storageKey,
      style,
      ...props
    },
    ref
  ) => {
    const getInitialSize = () => {
      if (storageKey) {
        try {
          const saved = localStorage.getItem(`dialog-size-${storageKey}`)
          if (saved) return JSON.parse(saved) as { width: number; height: number; maximized?: boolean }
        } catch { /* ignore */ }
      }
      return { width: defaultWidth ?? 0, height: defaultHeight ?? 0, maximized: false }
    }

    const initial = getInitialSize()
    const [size, setSize] = React.useState<{ width: number; height: number }>({
      width: initial.width,
      height: initial.height,
    })
    const [maximized, setMaximized] = React.useState(initial.maximized ?? false)
    const [isDragging, setIsDragging] = React.useState(false)
    const sizeBeforeMaximize = React.useRef(size)
    const contentRef = React.useRef<HTMLDivElement | null>(null)
    const dragRef = React.useRef<{
      edge: string
      startX: number
      startY: number
      startW: number
      startH: number
    } | null>(null)
    const rafRef = React.useRef<number>(0)
    const pendingSize = React.useRef<{ w: number; h: number } | null>(null)

    // Merge refs
    const mergedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        contentRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      },
      [ref]
    )

    // Persist size (debounced — only on committed state changes, not during drag)
    React.useEffect(() => {
      if (storageKey && (size.width > 0 || size.height > 0)) {
        localStorage.setItem(
          `dialog-size-${storageKey}`,
          JSON.stringify({ ...size, maximized })
        )
      }
    }, [size, maximized, storageKey])

    const clampW = React.useCallback((w: number) =>
      Math.max(minWidth, Math.min(w, maxWidth ?? window.innerWidth * 0.95)),
      [minWidth, maxWidth]
    )
    const clampH = React.useCallback((h: number) =>
      Math.max(minHeight, Math.min(h, maxHeight ?? window.innerHeight * 0.95)),
      [minHeight, maxHeight]
    )

    // Apply size directly to DOM — no React re-render
    const applySize = React.useCallback((w: number, h: number) => {
      const el = contentRef.current
      if (!el) return
      el.style.width = `${w}px`
      el.style.height = `${h}px`
    }, [])

    const onPointerDown = (edge: string) => (e: React.PointerEvent) => {
      if (maximized) return
      e.preventDefault()
      e.stopPropagation()

      const el = contentRef.current
      const rect = el?.getBoundingClientRect()
      if (!rect) return

      // Disable CSS transitions during drag for instant feedback
      if (el) el.style.transition = 'none'

      dragRef.current = {
        edge,
        startX: e.clientX,
        startY: e.clientY,
        startW: rect.width,
        startH: rect.height,
      }
      setIsDragging(true)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    }

    // All pointer move/up via a single stable ref-based handler — zero re-renders during drag
    React.useEffect(() => {
      const onMove = (e: PointerEvent) => {
        const drag = dragRef.current
        if (!drag) return

        const dx = e.clientX - drag.startX
        const dy = e.clientY - drag.startY
        const { edge, startW, startH } = drag

        let newW = startW
        let newH = startH

        if (edge.includes('e')) newW = startW + dx * 2
        if (edge.includes('w')) newW = startW - dx * 2
        if (edge.includes('s')) newH = startH + dy * 2
        if (edge.includes('n')) newH = startH - dy * 2

        newW = clampW(newW)
        newH = clampH(newH)

        pendingSize.current = { w: newW, h: newH }

        // Batch DOM writes to next animation frame
        if (!rafRef.current) {
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = 0
            if (pendingSize.current) {
              applySize(pendingSize.current.w, pendingSize.current.h)
            }
          })
        }
      }

      const onUp = () => {
        if (!dragRef.current) return
        // Cancel any pending rAF
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = 0
        }
        // Flush last pending size to DOM
        if (pendingSize.current) {
          applySize(pendingSize.current.w, pendingSize.current.h)
        }

        const el = contentRef.current
        if (el) el.style.transition = ''

        // Commit final size to React state (single re-render)
        if (pendingSize.current) {
          setSize({ width: pendingSize.current.w, height: pendingSize.current.h })
        }

        dragRef.current = null
        pendingSize.current = null
        setIsDragging(false)
      }

      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', onUp)
      return () => {
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', onUp)
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
      }
    }, [clampW, clampH, applySize])

    const toggleMaximize = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (maximized) {
        setSize(sizeBeforeMaximize.current)
        setMaximized(false)
      } else {
        sizeBeforeMaximize.current = size
        setSize({ width: window.innerWidth * 0.95, height: window.innerHeight * 0.95 })
        setMaximized(true)
      }
    }

    const handleStyle: React.CSSProperties = {
      position: 'absolute',
      zIndex: 50,
    }

    const sizeStyle: React.CSSProperties =
      maximized
        ? { width: '95vw', height: '95vh' }
        : size.width > 0 && size.height > 0
        ? { width: size.width, height: size.height }
        : {}

    return (
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={mergedRef}
          data-resizable-content
          className={cn(
            "fixed left-[50%] top-[50%] z-[100] grid w-fit min-w-[min(400px,90vw)] max-w-[95vw] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 pointer-events-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
            isDragging && "select-none",
            className
          )}
          style={{ ...sizeStyle, ...style }}
          {...props}
        >
          {children}

          {/* Maximize / Restore button */}
          <button
            onClick={toggleMaximize}
            className="absolute right-10 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            title={maximized ? 'Restaurar' : 'Maximizar'}
          >
            {maximized ? <RestoreIcon className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {/* Close button */}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* Resize handles – edges */}
          <div
            style={{ ...handleStyle, top: 0, left: HANDLE_SIZE, right: HANDLE_SIZE, height: HANDLE_SIZE, cursor: 'ns-resize' }}
            onPointerDown={onPointerDown('n')}
          />
          <div
            style={{ ...handleStyle, bottom: 0, left: HANDLE_SIZE, right: HANDLE_SIZE, height: HANDLE_SIZE, cursor: 'ns-resize' }}
            onPointerDown={onPointerDown('s')}
          />
          <div
            style={{ ...handleStyle, left: 0, top: HANDLE_SIZE, bottom: HANDLE_SIZE, width: HANDLE_SIZE, cursor: 'ew-resize' }}
            onPointerDown={onPointerDown('w')}
          />
          <div
            style={{ ...handleStyle, right: 0, top: HANDLE_SIZE, bottom: HANDLE_SIZE, width: HANDLE_SIZE, cursor: 'ew-resize' }}
            onPointerDown={onPointerDown('e')}
          />
          {/* Resize handles – corners */}
          <div
            style={{ ...handleStyle, top: 0, left: 0, width: HANDLE_SIZE * 2, height: HANDLE_SIZE * 2, cursor: 'nwse-resize' }}
            onPointerDown={onPointerDown('nw')}
          />
          <div
            style={{ ...handleStyle, top: 0, right: 0, width: HANDLE_SIZE * 2, height: HANDLE_SIZE * 2, cursor: 'nesw-resize' }}
            onPointerDown={onPointerDown('ne')}
          />
          <div
            style={{ ...handleStyle, bottom: 0, left: 0, width: HANDLE_SIZE * 2, height: HANDLE_SIZE * 2, cursor: 'nesw-resize' }}
            onPointerDown={onPointerDown('sw')}
          />
          <div
            style={{ ...handleStyle, bottom: 0, right: 0, width: HANDLE_SIZE * 2, height: HANDLE_SIZE * 2, cursor: 'nwse-resize' }}
            onPointerDown={onPointerDown('se')}
          />
        </DialogPrimitive.Content>
      </DialogPortal>
    )
  }
)
ResizableDialogContent.displayName = "ResizableDialogContent"

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  ResizableDialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}

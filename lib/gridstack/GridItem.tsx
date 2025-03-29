import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from "@dnd-kit/core";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import useResizable from "../dnd/useResizable";
import classNames from "classnames";
import type { GridNodeProps } from "./type";
import { GridStackPayloadContext } from "./GridStackContext";

export default function GridItem(props: GridNodeProps) {
    const { id, className, rowStart, colStart, rowEnd, colEnd, } = props

    const [size, setSize] = useState<{ width: number, height: number } | undefined>()
    const [isResizing, setIsResizing] = useState(false)
    const { onHandleResizeEnd, onGridItemRender } = useContext(GridStackPayloadContext)

    const { node, isDragging, attributes, listeners, setNodeRef, transform } = useDraggable({
        id,
        disabled: isResizing,
        data: { ...props }, // 在drag过程中无法修改
    });

    const { listeners: resizeListeners } = useResizable({
        resizeRef: node,
        onResizeStart() {
            setIsResizing(true)
        },
        onResizeMove(size) {
            setSize(size)
        },
        onResizeEnd(size) {
            setSize(undefined)
            setIsResizing(false)
            onHandleResizeEnd?.({ id })
        },
    })

    return <div
        ref={setNodeRef}
        onPointerDownCapture={(e) => {
            // console.log('on grid item down capture');
            const ele = e.target as HTMLElement
            const onPointerMoveCapture = (e: Event) => {
                clearTimeout(handle)
            }
            // ele.addEventListener
            document.addEventListener('pointermove', onPointerMoveCapture, { capture: true })
            const handle = setTimeout(() => {
                // console.log('on grid item down capture', '触发drag事件');
                document.removeEventListener('pointermove', onPointerMoveCapture)
                listeners?.['onPointerDown']?.(e)
            }, 500)
        }}
        // onPointerMoveCapture={(e) => {
        //     console.log('on grid item move capture'); // 只要鼠标在element上，会一直触发
        // }}
        {...listeners}
        {...attributes}
        className={classNames(
            "gridstack-item",
            "box-border border-1 border-transparent",
            "relative ",
            className,
            // isDragging ? '' : '!opacity-100'
        )}
        {...props}
        style={{
            ...(rowStart && colStart && rowEnd && colEnd ? { gridArea: `${rowStart} / ${colStart} / ${rowEnd} / ${colEnd}` } : {}),
            ...(props?.style ?? {}),
            ...(size ? { width: `${size.width}px`, height: `${size.height}px` } : {}),
        }}>
        {onGridItemRender ? onGridItemRender?.(props) : props.children}
        <div
            className="resize-handle"
            {...resizeListeners}
            style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '10px',
                height: '10px',
                backgroundColor: 'grey',
                cursor: 'nwse-resize',
                zIndex: 100,
            }}
        ></div>
    </div>
}
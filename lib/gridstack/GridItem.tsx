import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from "@dnd-kit/core";
import React, { useCallback, useEffect, useRef, useState } from "react";
import useResizable from "../dnd/useResizable";
import classNames from "classnames";
import type { GridNodeProps } from "./type";

export default function GridItem(props: GridNodeProps) {
    const { id, rowStart, colStart, rowEnd, colEnd, onResizeEnd, onGridItemRender } = props

    const [size, setSize] = useState<{ width: number, height: number } | undefined>()
    const [isResizing, setIsResizing] = useState(false)

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
            onResizeEnd?.({ id })
        },
    })

    useEffect(() => {
        const capture = (e: Event) => {
            console.log('pointerdown capture');
            const ele = e.target as HTMLElement
            ele.style.border = '2px dashed green'
            setTimeout(() => {
                ele.style.border = ''
            }, 5000)
        }
        console.log(node.current, 'add capture listener');
        node.current!.addEventListener('pointerdown', capture, { capture: true })
        return () => {
            node.current?.removeEventListener('pointerdown', capture,)
        }
    }, [])

    return <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={classNames(
            "relative grid-item bg-blue-200",
            // isDragging ? '' : '!opacity-100'
        )}
        {...props}
        style={{
            ...(rowStart && colStart && rowEnd && colEnd ? { gridArea: `${rowStart} / ${colStart} / ${rowEnd} / ${colEnd}` } : {}),
            ...(props?.style ?? {}),
            ...(size ? { width: `${size.width}px`, height: `${size.height}px` } : {}),
        }}>
        {/* {id === 'grid-item-1' ? <button className="w-[30px] h-[30px]">ccc</button> : props.children} */}
        {/* <input className="w-full h-full" /> */}
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
            }}
        ></div>
    </div>
}
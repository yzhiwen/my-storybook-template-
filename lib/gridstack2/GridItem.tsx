import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from "@dnd-kit/core";
import React, { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import useResizable from "../dnd/useResizable";
import classNames from "classnames";
import type { GridNodeProps, PositionParams } from "./type";
import { GridStackPayloadContext } from "./GridStackContext";
import { calcGridItemPosition } from "./utils";

export default function GridItem(props: GridNodeProps) {
    const { id, className, rowStart, colStart, rowEnd, colEnd, } = props

    const [size, setSize] = useState<{ width: number, height: number } | undefined>()
    const [isResizing, setIsResizing] = useState(false)
    const { rootGridTree, rootGridProps, clickId, onHandleResizeMove, onHandleResizeEnd, onGridItemRender } = useContext(GridStackPayloadContext)

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
            onHandleResizeMove?.({ id, ...size })
        },
        onResizeEnd(size) {
            setSize(undefined)
            setIsResizing(false)
            onHandleResizeEnd?.({ id })
        },
    })

    const updateStyle_ = () => {
        const pid = rootGridTree.get(id)?.parent ?? rootGridProps.id
        const parentGridNode = rootGridTree.get(pid)!.node!
        const parent = document.getElementById(pid)!
        const posParams: PositionParams = {
            margin: [0, 0],// 固定
            containerPadding: [0, 0],// 固定
            containerWidth: parent.getBoundingClientRect().width, // 从父节点取
            cols: parentGridNode.col, // 从父节点取
            rowHeight: 40, // 固定
            maxRows: Infinity,
            // maxRows: parentGridNode.type === 'subgrid' ? parentGridNode.h : Infinity, // 固定
        }
        const pos = calcGridItemPosition(
            posParams,
            props.x!,
            props.y!,
            props.w!,
            props.h!,
            {},
        );

        const { left, top, width, height } = pos
        const style: any = {
            // drag的是不能使用translate，会影响overlay
            // transform: `translate(${left}px,${top}px)`,
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`,
            position: "absolute"
        }
        // console.log('grid item ', props, parentGridNode, parent.getBoundingClientRect().width, style);
        return style
    }
    // 不放在useEffect，可能会造成GridItem的子级有两次width，但是子级只用第一次width去计算
    const style_ = updateStyle_()

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
            ...(style_),
            ...(size ? { width: `${size.width}px`, height: `${size.height}px` } : {}),
        }}>
        {/* <div className="absolute bottom-0">{`props: ${props.x} ${props.y} ${props.w} ${props.h}`}</div> */}
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
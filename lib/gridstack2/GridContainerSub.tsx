import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from "@dnd-kit/core";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import useResizable from "../dnd/useResizable";
import classNames from "classnames";
import type { GridNodeProps, PositionParams } from "./type";
import GridItem from "./GridItem";
import { GridStackPayloadContext } from "./GridStackContext";
import { calcGridItemPosition } from "./utils";

export default function GridContainerSub(props: GridNodeProps) {
    const {
        id, style, className,
        row = 5, col = 10, gap, items,
        rowStart, colStart, rowEnd, colEnd,
        children,
    } = props
    const [gridItems, setGridItems] = useState<GridNodeProps[]>([])

    const [size, setSize] = useState<{ width: number, height: number } | undefined>()
    const [isResizing, setIsResizing] = useState(false)
    const { rootGridTree, onHandleResizeEnd } = useContext(GridStackPayloadContext)

    const { node: nodeDrag, isDragging, attributes, listeners: dragListeners, setNodeRef: setNodeRefDrag, transform } = useDraggable({
        id,
        disabled: isResizing,
        data: { ...props }, // 在drag过程中无法修改
    });

    const { node: nodeDrop, setNodeRef: setNodeRefDrop } = useDroppable({
        id,
        disabled: isDragging || isResizing,
        data: { ...props }
    })

    const { listeners: resizeListeners } = useResizable({
        resizeRef: nodeDrag,
        onResizeStart() {
            setIsResizing(true)
        },
        onResizeMove(size) {
            // console.log(size, 'move');
            setSize(size)
        },
        onResizeEnd(size) {
            setSize(undefined)
            setIsResizing(false)
            onHandleResizeEnd?.({ id })
        },
    })

    useEffect(() => {
        if (props.items) {
            setGridItems(props.items)
        }
    }, [props])

    const updateStyle_ = () => {
        const pid = rootGridTree.get(id)!.parent!
        const parentGridNode = rootGridTree.get(pid)!.node!
        const parent = document.getElementById(pid)!
        const posParams: PositionParams = {
            margin: [0, 0],// 固定
            containerPadding: [0, 0],// 固定
            containerWidth: parent.getBoundingClientRect().width, // 从父节点取
            cols: parentGridNode.col, // 从父节点取
            rowHeight: 40, // 固定
            maxRows: Infinity, // 固定
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
        // console.log('grid sub', style);
        return style
    }
    // 不放在useEffect，可能会造成GridItem的子级有两次width，但是子级只用第一次width去计算
    const style_ = updateStyle_()

    return <div id={id}
        ref={(ele) => {
            setNodeRefDrag(ele)
            setNodeRefDrop(ele)
        }}
        {...dragListeners}
        {...attributes}
        className={classNames(
            'gridstack-sub',
            `relative bg-blue-100`,
            // 'grid',
            // subgrid的时候，width/height无效
            // size ? `` : `grid-cols-subgrid grid-rows-subgrid`,
            // `row-start-4 col-start-5 row-span-2 col-span-3 bg-blue-700`,
            // `grid-cols-${col} grid-rows-${row}`,
            className,
        )}
        style={{
            ...(rowStart && colStart && rowEnd && colEnd ? { gridArea: `${rowStart} / ${colStart} / ${rowEnd} / ${colEnd}` } : {}),
            ...(props?.style ?? {}),
            ...(style_),
            ...(size ? { width: `${size.width}px`, height: `${size.height}px` } : {}),
        }}>
        {gridItems.map((item, index) => {
            if (item.type === 'subgrid') {
                return <GridContainerSub {...item} items={item.items} />
            }
            return <GridItem {...item} key={item.id} />
        })}
        {children}
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

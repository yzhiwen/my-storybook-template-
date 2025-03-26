import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from "@dnd-kit/core";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import useResizable from "../dnd/useResizable";
import classNames from "classnames";
import type { GridNodeProps } from "./type";
import GridItem from "./GridItem";
import { GridStackPayloadContext } from "./GridStackContext";

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
    const { onHandleResizeEnd } = useContext(GridStackPayloadContext)

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

    return <div id={id}
        ref={(ele) => {
            setNodeRefDrag(ele)
            setNodeRefDrop(ele)
        }}
        {...dragListeners}
        {...attributes}
        className={classNames(
            `relative grid bg-blue-100`,
            // subgrid的时候，width/height无效
            size ? `` : `grid-cols-subgrid grid-rows-subgrid`,
            // `row-start-4 col-start-5 row-span-2 col-span-3 bg-blue-700`,
            // `grid-cols-${col} grid-rows-${row}`,
            className,
        )}
        style={{
            ...(rowStart && colStart && rowEnd && colEnd ? { gridArea: `${rowStart} / ${colStart} / ${rowEnd} / ${colEnd}` } : {}),
            ...(props?.style ?? {}),
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

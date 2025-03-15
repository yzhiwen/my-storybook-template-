import { DndContext, DragOverlay, useDraggable, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from "@dnd-kit/core";
import React, { useCallback, useEffect, useRef, useState } from "react";
import useResizable from "../dnd/useResizable";
import classNames from "classnames";

type GridProps = {
    row?: number
    col?: number
    gap?: number
    items?: GridItem[]
}

type GridItem = {
    rowStart?: number
    colStart?: number
    rowEnd?: number
    colEnd?: number
}

const TestGridItems: GridItem[] = [
    {}, { rowStart: 2, colStart: 3, rowEnd: 3, colEnd: 4 }, {}
]

export default function (props: GridProps) {
    const { row = 5, col = 10, gap, items = TestGridItems } = props
    const [activeId, setActiveId] = useState<any>(null);
    const [activeArea, setActiveArea] = useState<any>(null);
    const [activeStyle, setActiveStyle] = useState<any>(null)
    const [gridItems, setGridItems] = useState<GridItem[]>(items ?? [])

    return <DndContext onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
        <div id='grid-c'
            className={classNames(
                `grid w-[500px] h-[300px] bg-amber-200`,
                `grid-cols-${col} grid-rows-${row}`,
            )}>
            {gridItems.map((item, index) => {
                return <GridItem id={`grid-item-${index}`} key={index} {...item} onResizeEnd={onGridItemResizeEnd}>{index}</GridItem>
            })}
        </div>
        <DragOverlay>
            {activeId ? <GridItemOverlay id="grid-item-overlay" className="bg-blue-200" style={activeStyle} /> : null}
        </DragOverlay>
    </DndContext>

    function handleDragStart(event: DragStartEvent) {
        // console.log("on start", event)
        const target = event.activatorEvent.target as HTMLElement
        setActiveId(event.active.id);
        setActiveStyle({
            ...activeStyle,
            width: target.getBoundingClientRect().width,
            height: target.getBoundingClientRect().height,
        })
    }

    function handleDragEnd(event: DragEndEvent) {
        // console.log("on end", event)
        setActiveId(null);
        setActiveStyle(null);
        setActiveArea(null);
        setGridItems((items) => {
            const items_ = items.map((item, index) => {
                if (event.active.id === `grid-item-${index}`) {
                    return { ...activeArea }
                }
                return item
            })
            return items_
        })
    }

    function onGridItemResizeEnd({ id }: any) {
        const c = document.getElementById('grid-c')!
        const item = document.getElementById(id)!
        const crect = c.getBoundingClientRect()
        const rect = item.getBoundingClientRect()
        const lastest = {
            width: rect.width, height: rect.height,
            x: rect.x, y: rect.y,
            left: rect.left, top: rect.top,
            right: rect.right, bottom: rect.bottom,
        }
        const area = calcGridItemArea({
            row: 5, col: 10,
            x: crect.x, y: crect.y, width: crect.width, height: crect.height,
            itemX: lastest.x, itemY: lastest.y, itemWidth: lastest.width, itemHeight: lastest.height
        })

        setGridItems((items) => {
            const items_ = items.map((item, index) => {
                if (id === `grid-item-${index}`) {
                    return { ...area }
                }
                return item
            })
            return items_
        })
    }

    function handleDragMove(event: DragMoveEvent) {
        // console.log("on move", event)
        const { x: deltaX, y: deltaY } = event.delta
        const c = document.getElementById('grid-c')!
        const item = event.activatorEvent.target as HTMLElement

        const crect = c.getBoundingClientRect()
        const rect = item.getBoundingClientRect()
        // 没考虑鼠标
        const lastest = {
            width: rect.width, height: rect.height,
            x: rect.x + deltaX, y: rect.y + deltaY,
            left: rect.left + deltaX, top: rect.top + deltaY,
            right: rect.right + deltaX, bottom: rect.bottom + deltaY,
        }
        const area = calcGridItemArea({
            row, col,
            x: crect.x, y: crect.y, width: crect.width, height: crect.height,
            itemX: lastest.x, itemY: lastest.y, itemWidth: lastest.width, itemHeight: lastest.height
        })
        setActiveArea(area)
        setActiveStyle({
            ...activeStyle,
            gridArea: area["grid-area"]
        })
    }
}

type GridAreaCalc = {
    row: number
    col: number

    x: number
    y: number
    width: number
    height: number
    // gap?

    itemX: number
    itemY: number
    itemWidth: number
    itemHeight: number
}
type GridAreaCalcResult = { rowStart: number, rowEnd: number, colStart: number, colEnd: number, 'grid-area': string, }
function calcGridItemArea(options: GridAreaCalc): GridAreaCalcResult {
    const rowSize = options.height / options.row
    const colSize = options.width / options.col

    // 假设完全在容器内
    let rowStart = 1;
    for (; rowStart <= options.row; rowStart += 1) {
        if (options.itemY - options.y < rowStart * rowSize) break
    }
    let colStart = 1;
    for (; colStart <= options.col; colStart += 1) {
        if (options.itemX - options.x < colStart * colSize) break
    }

    let rowSpan = 1;
    while (true) {
        if ((rowSpan + 1) * rowSize > options.itemHeight) break
        rowSpan += 1
    }
    let rowEnd = rowStart + rowSpan

    let colSpan = 1;
    while (true) {
        if ((colSpan + 1) * colSize > options.itemWidth) break
        colSpan += 1
    }
    let colEnd = colStart + colSpan
    // console.log(">>>", JSON.stringify({rowStart, rowEnd, colStart, colEnd, colSpan, rowSpan}))

    // let rowEnd = 1;
    // for (; rowEnd <= options.row; rowEnd += 1) {
    //     if (options.itemY - options.y + options.itemHeight < rowEnd * rowSize) break
    // }
    // let colEnd = 1;
    // for (; colEnd <= options.col; colEnd += 1) {
    //     if (options.itemX - options.x + options.itemWidth < colEnd * colSize) break
    // }
    return {
        rowStart, rowEnd, colStart, colEnd,
        'grid-area': `${rowStart} / ${colStart} / ${rowEnd} / ${colEnd}`
    }
}

type GridItemProps = {
    id: string

    style?: React.CSSProperties
    className?: string

    rowStart?: number
    colStart?: number
    rowEnd?: number
    colEnd?: number
    children?: any

    onResizeStart?: (data: { id: string, width?: number, height?: number }) => void
    onResizeMove?: (data: { id: string, width?: number, height?: number }) => void
    onResizeEnd?: (data: { id: string, width?: number, height?: number }) => void
}

function GridItem(props: GridItemProps) {
    const { rowStart, colStart, rowEnd, colEnd, onResizeEnd } = props

    const [size, setSize] = useState<{ width: number, height: number } | undefined>()
    const [isResizing, setIsResizing] = useState(false)

    const { node, attributes, listeners, setNodeRef, transform } = useDraggable({
        id: props.id,
        disabled: isResizing,
        data: {}, // 在drag过程中无法修改
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
            onResizeEnd?.({ id: props.id })
        },
    })

    return <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className="relative grid-item grid bg-blue-200"
        {...props}
        style={{
            ...(rowStart && colStart && rowEnd && colEnd ? { gridArea: `${rowStart} / ${colStart} / ${rowEnd} / ${colEnd}` } : {}),
            ...(props?.style ?? {}),
            ...(size ? { width: `${size.width}px`, height: `${size.height}px` } : {}),
        }}>
        {props.children}
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

function GridItemOverlay(props: any) {
    return <div {...props}></div>
}
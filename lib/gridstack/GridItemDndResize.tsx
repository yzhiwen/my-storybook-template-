import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from "@dnd-kit/core";
import React, { useCallback, useEffect, useRef, useState } from "react";
import useResizable from "../dnd/useResizable";
import classNames from "classnames";
import type { GridNodeProps } from "./type";

type GridProps = {
    id: string
    style?: React.CSSProperties
    className?: string

    row?: number
    col?: number
    gap?: number
    items?: GridItem[]

    onResizeEnd?: (data: any) => void
}

type GridItem = {
    id: string
    type?: 'grid' | 'subgrid'
    row?: number
    col?: number
    gap?: number
    items?: GridItem[]

    rowStart?: number
    colStart?: number
    rowEnd?: number
    colEnd?: number
}

const TestGridItems: GridItem[] = [
    { id: 'grid-item-1' }, 
    { id: 'grid-item-2', rowStart: 2, colStart: 3, rowEnd: 3, colEnd: 4 }, 
    { id: 'grid-item-3', },
    { id: 'grid-item-4', type: 'subgrid', }
]

type Props = GridProps & {
    id?: string
    gridNode: GridNodeProps
}

export default function (props: Props) {
    const {
        id = `grid-${Math.random().toString().substring(2)}`, style, className,
        row = 5, col = 10, gap, items,
        gridNode
    } = props
    const [activeId, setActiveId] = useState<any>(null);
    const [activeArea, setActiveArea] = useState<any>(null);
    const [activeStyle, setActiveStyle] = useState<any>(null)
    const [gridItems, setGridItems] = useState<GridItem[]>(items ?? TestGridItems)

    return <DndContext onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
        <GridContainerNew {...props} id={id} items={gridItems} onResizeEnd={onGridItemResizeEnd} />
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

        if (event.over?.id === 'grid-item-4') {
            console.log('grid-item-4', gridItems);
            const items_ = gridItems.filter(item => item.id !== event.active.id)
            const item = gridItems.find(item => item.id === event.active.id!)
            const sub = gridItems.find(item => item.type === 'subgrid')!
            sub.items = [{...item, ...activeArea}]
            console.log(items_);
            setGridItems(items_)
            
            // setGridItems((items) => {
            //     const items_ = items.map((item, index) => {
            //         if (event.active.id === item.id) {
            //             return { ...item, ...activeArea }
            //         }
            //         return item
            //     })
            //     return items_
            // })
            return
        }
        setGridItems((items) => {
            const items_ = items.map((item, index) => {
                if (event.active.id === item.id) {
                    return { ...item, ...activeArea }
                }
                return item
            })
            return items_
        })
    }

    function handleDragMove(event: DragMoveEvent) {
        // console.log("on move", id, event)
        const { x: deltaX, y: deltaY } = event.delta
        const c = document.getElementById(id)!
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

    function onGridItemResizeEnd({ id: gridItemId }: any) {
        // console.log(">>> on resize end", )
        const c = document.getElementById(id)!
        const item = document.getElementById(gridItemId)!
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
                if (gridItemId === item.id) {
                    return { ...item, ...area }
                }
                return item
            })
            return items_
        })
    }
}

function GridContainer(props: GridNodeProps) {
    const {
        id, style, className,
        row = 5, col = 10, gap, items,
        onResizeEnd,
    } = props
    const [gridItems, setGridItems] = useState<GridNodeProps[]>([])
    const { setNodeRef } = useDroppable({ id, })

    useEffect(() => {
        if (props.items) {
            setGridItems(props.items)
        }
    }, [props])

    return <div id={id}
        ref={setNodeRef}
        className={classNames(
            className,
            `grid w-[500px] h-[300px] bg-amber-200`,
            `grid-cols-${col} grid-rows-${row}`,
        )}>
        {gridItems.map((item, index) => {
            if (item.type === 'subgrid') {
                return <GridContainer
                    id={item.id}
                    key={item.id}
                    className="grid-cols-subgrid grid-rows-subgrid row-start-4 col-start-5 row-span-2 col-span-3 bg-blue-700"
                    items={item.items}
                />
            }
            return <GridItem {...item} key={item.id} onResizeEnd={onResizeEnd}>{item.id}</GridItem>
        })}
    </div>
}

function GridContainerNew(props: GridProps) {
    const {
        id, style, className,
        row = 5, col = 10, gap, items,
        onResizeEnd,
    } = props
    const [gridItems, setGridItems] = useState<GridItem[]>([])
    const { setNodeRef } = useDroppable({ id, })

    useEffect(() => {
        if (props.items) {
            setGridItems(props.items)
        }
    }, [props])

    return <div id={id}
        ref={setNodeRef}
        className={classNames(
            className,
            `grid w-[500px] h-[300px] bg-amber-200`,
            `grid-cols-${col} grid-rows-${row}`,
        )}>
        {gridItems.map((item, index) => {
            if (item.type === 'subgrid') {
                return <GridContainerNew
                    id={item.id}
                    key={item.id}
                    className="grid-cols-subgrid grid-rows-subgrid row-start-4 col-start-5 row-span-2 col-span-3 bg-blue-700"
                    items={item.items}
                />
            }
            return <GridItem {...item} key={item.id} onResizeEnd={onResizeEnd}>{item.id}</GridItem>
        })}
    </div>
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
    const { id, rowStart, colStart, rowEnd, colEnd, onResizeEnd } = props

    const [size, setSize] = useState<{ width: number, height: number } | undefined>()
    const [isResizing, setIsResizing] = useState(false)

    const { node, attributes, listeners, setNodeRef, transform } = useDraggable({
        id,
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
            onResizeEnd?.({ id })
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
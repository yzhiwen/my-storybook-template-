import { DndContext, DragOverlay, useDraggable, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";

export default function () {
    const [activeId, setActiveId] = useState<any>(null);
    const [activeStyle, setActiveStyle] = useState<any>(null)
    const [finalStyle, setfinalStyle] = useState<any>(null)

    useEffect(() => {
        const c = document.getElementById('grid-c')!
        const item = document.getElementById('grid-item')!
        // console.log('>>grid container', JSON.stringify(c.getBoundingClientRect()), JSON.stringify(item.getBoundingClientRect()))
    }, [])

    return <DndContext onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
        <div id='grid-c' className="grid w-[500px] h-[300px] grid-cols-10 grid-rows-5 bg-amber-200">
            <GridItem id="grid-item" style={finalStyle} />
            <GridItem id="grid-item-2" className="bg-blue-500 col-start-2 col-end-8" />
        </div>
        <DragOverlay>
            {activeId ? <GridItem style={activeStyle} /> : null}
        </DragOverlay>
    </DndContext>

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id);
        const target = event.activatorEvent.target as HTMLElement
        setActiveStyle({
            ...activeStyle,
            width: target.getBoundingClientRect().width,
            height: target.getBoundingClientRect().height,
        })
    }

    function handleDragEnd(event: DragEndEvent) {
        setActiveId(null);
        setActiveStyle(null)
        setfinalStyle(activeStyle)
        console.log('>>>', activeStyle)
    }

    function handleDragMove(event: DragMoveEvent) {
        // console.log("on move", event)
        const { x: deltaX, y: deltaY } = event.delta
        const c = document.getElementById('grid-c')!
        const item = event.activatorEvent.target as HTMLElement
        // on move 
        // {"x":235.5,"y":20.5,"width":500,"height":300,"top":20.5,"right":735.5,"bottom":320.5,"left":235.5} 
        // {"x":285.5,"y":80.5,"width":100,"height":120,"top":80.5,"right":385.5,"bottom":200.5,"left":285.5}
        // console.log('on move', JSON.stringify(c.getBoundingClientRect()), JSON.stringify(item.getBoundingClientRect()))
        // console.log("on move", deltaX, deltaY)

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
            row: 5, col: 10,
            x: crect.x, y: crect.y, width: crect.width, height: crect.height,
            itemX: lastest.x, itemY: lastest.y, itemWidth: lastest.width, itemHeight: lastest.height
        })
        setActiveStyle({
            ...activeStyle,
            gridArea: `${area.rowStart} / ${area.colStart} / ${area.rowEnd} / ${area.colEnd}`
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
function calcGridItemArea(options: GridAreaCalc) {
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
    }
}

function GridItem(props: any) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: props.id,
    });
    const style = {
        transform: CSS.Translate.toString(transform),
    };

    //  row-start-2 col-start-2 row-span-2 col-span-2
    return <div ref={setNodeRef} {...listeners} {...attributes}
        className="grid-item grid bg-blue-200"
        {...props}
        style={{
            // gridArea: '5 / 3 / 7 / 6',
            ...(props?.style ?? {})
        }}></div>
}
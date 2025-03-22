import { DndContext, DragOverlay, useDraggable, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from "@dnd-kit/core";
import GridStack from "./GridStack";
import { TestGridNodeProps, type GridNodeProps } from "./type";
import { useState } from "react";
import calcGridItemArea from "./calcGridItemArea";
import IndexTree from "./IndexTree";
import GridItemOverlay from "./GridItemOverlay";
import calcGridItemMoveArea from "./calcGridItemMoveArea";
import onHandleDragEnd from "./onHandleDragEnd";

export default function GridStackSample() {

    const [draging, setDraging] = useState(false)

    const [activeArea, setActiveArea] = useState<any>(null);
    const [activeStyle, setActiveStyle] = useState<any>(null)
    const [rootGridProps, setRootGridProps] = useState<GridNodeProps>(TestGridNodeProps)

    return <DndContext
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
    >
        <div className="grid gap-2">
            <ExternalComponents />
            <GridStack disableDndContext={draging} gridRoot={rootGridProps} onGridRootChange={(_) => setRootGridProps(_)} />
        </div>
        <DragOverlay>
            {activeStyle ? <GridItemOverlay id="grid-item-overlay" className="bg-blue-200" style={activeStyle} /> : null}
        </DragOverlay>
    </DndContext>

    function handleDragStart(event: DragStartEvent) {
        setDraging(true)
        const target = event.activatorEvent.target as HTMLElement
        setActiveStyle({
            ...activeStyle,
            width: target.getBoundingClientRect().width,
            height: target.getBoundingClientRect().height,
        })
    }

    function handleDragMove(event: DragMoveEvent) {
        const { x: deltaX, y: deltaY } = event.delta
        const params = {
            overId: event.over?.id?.toString(),
            overProps: event.over?.data.current,
            activeId: event.active.id.toString(),
            deltaX,
            deltaY,
        }
        const gridItemMoveAreaRes = calcGridItemMoveArea(params)
        if (gridItemMoveAreaRes) {
            setActiveArea(gridItemMoveAreaRes.gridItemArea)
            setActiveStyle(gridItemMoveAreaRes.overlayStyle)
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        setDraging(false)
        setActiveStyle(null);
        setActiveArea(null);
        const root_ = onHandleDragEnd({
            overId: event.over?.id.toString(),
            overProps: event.over?.data.current,

            activeId: event.active.id.toString(),
            activeProps: event.active.data.current,
            activeArea: activeArea,

            root: rootGridProps
        })
        setRootGridProps(root_)
    }
}

function ExternalComponents() {
    return <div className="flex flex-row gap-2">
        <ExternalA />
        <ExternalB />
        <ExternalB row={2} col={1} />
    </div>
}

function ExternalA() {
    const { node, setNodeRef, listeners, attributes, } = useDraggable({
        id: 'ExternalA'
    })
    return <div
        id="ExternalA"
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className="bg-amber-300 z-50">
        ExternalA
    </div>
}


function ExternalB(props: any) {
    const { row = 1, col = 1 } = props
    const id = 'ExternalB ' + row + 'x' + col
    const { node, setNodeRef, listeners, attributes, } = useDraggable({
        id,
        data: {
            // 必须
            type: 'subgrid',
            row: row ?? 1,
            col: col ?? 1,
            itmes: [],
        }
    })
    return <div
        id={id}
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className="bg-amber-300 z-50">
        SubGrid {row}x{col}
    </div>
}
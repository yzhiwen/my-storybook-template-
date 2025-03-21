import { DndContext, DragOverlay, useDraggable, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from "@dnd-kit/core";
import GridStack from "./GridStack";
import { TestGridNodeProps, type GridNodeProps } from "./type";
import { useState } from "react";
import calcGridItemArea from "./calcGridItemArea";
import IndexTree from "./IndexTree";
import GridItemOverlay from "./GridItemOverlay";

export default function GridStackSample() {

    const [draging, setDraging] = useState(false)

    const [activeId, setActiveId] = useState<any>(null);
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
            <GridStack disableDndContext={draging} gridRootProps={rootGridProps} />
        </div>
        {/* <DragOverlay>
            {activeStyle ? <div id="grid-item-external-overlay" className="bg-blue-200" style={activeStyle} /> : null}
        </DragOverlay> */}
         <DragOverlay>
            {activeId ? <GridItemOverlay id="grid-item-overlay" className="bg-blue-200" style={activeStyle} /> : null}
        </DragOverlay>
    </DndContext>

    function handleDragStart(event: DragStartEvent) {
        setDraging(true)
        setActiveId(event.active.id)
        const target = event.activatorEvent.target as HTMLElement
        setActiveStyle({
            ...activeStyle,
            width: target.getBoundingClientRect().width,
            height: target.getBoundingClientRect().height,
        })
    }

    function handleDragMove(event: DragMoveEvent) {
        const { x: deltaX, y: deltaY } = event.delta
        if (!event.over?.id) return
        calcDragNewArea({
            overId: event.over!.id,
            overProps: event.over!.data.current,
            activeId: event.active.id,
            deltaX,
            deltaY,
        })
    }

    function handleDragEnd(event: DragEndEvent) {
        setDraging(false)
        setActiveId(null)
        setActiveStyle(null);
        setActiveArea(null);

        setRootGridProps(root => {
            const tree = new IndexTree(root, 'id', 'items')
            console.log(root, tree);
            const overId = event.over!.id
            const activeTreeNode = tree.get(activeId)
            if (!activeTreeNode) {
                const overTreeNode = tree.get(overId.toString())
                if (overTreeNode) {
                    if (!overTreeNode.node.items) overTreeNode.node.items = []
                    overTreeNode.node.items.push({ ...activeArea, id: Math.random().toString().substring(2) })
                }
                return { ...root }
            }

            const parentId = activeTreeNode.parent
            if (parentId === overId) {
                // drag的父节点未变
                const items_ = root.items?.map(item => {
                    if (item.id === activeId) {
                        return { ...item, ...activeArea }
                    }
                    return { ...item }
                })
                return { ...root, items: items_ }
            } else {
                // drag的父节点改变
                const items_ = root.items?.filter(item => item.id !== activeId)
                const item = root.items?.find(item => item.id !== activeId)
                const parent = root.items?.find(item => item.id === event.over?.id)!
                parent.items = [...(parent.items ?? []), { ...item, ...activeArea }]
                return { ...root, items: items_ }
            }
            return root
        })
    }


    function calcDragNewArea(options: any) {
        const { overId, activeId, deltaX, deltaY, overProps } = options
        const { row, col } = overProps

        const over = document.getElementById(overId)!
        const active = document.getElementById(activeId)!
        console.log(over, active, activeId, 'calcDragNewArea');

        const crect = over.getBoundingClientRect()
        const rect = active.getBoundingClientRect()
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
            gridArea: area["grid-area"],
            x: area.x, y: area.y,
            width: area.width, height: area.height,
        })
    }
}

function ExternalComponents() {
    return <div className="flex flex-row">
        <ExternalA />
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
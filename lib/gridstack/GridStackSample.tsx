import { DndContext, DragOverlay, useDraggable, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from "@dnd-kit/core";
import GridStack from "./GridStack";
import { TestGridNodeProps, type GridNodeProps } from "./type";
import { useState } from "react";
import calcGridItemArea from "./calcGridItemArea";
import IndexTree from "./IndexTree";
import GridItemOverlay from "./GridItemOverlay";
import calcGridItemMoveArea from "./calcGridItemMoveArea";

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
            <GridStack disableDndContext={draging} gridRootProps={rootGridProps} />
        </div>
        <DragOverlay>
            {activeStyle ? <GridItemOverlay id="grid-item-overlay" className="bg-blue-200" style={activeStyle} /> : null}
        </DragOverlay>
    </DndContext>

    function handleDragStart(event: DragStartEvent) {
        setDraging(true)
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

        setRootGridProps(root => {
            const activeId = event.active.id as string
            const overId = event.over!.id
            const tree = new IndexTree(root, 'id', 'items')
            console.log(root, tree);
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
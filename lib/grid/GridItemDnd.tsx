import { DndContext, DragOverlay, useDraggable, type DragStartEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

export default function () {
    const [activeId, setActiveId] = useState<any>(null);
    const [activeStyle, setActiveStyle] = useState<any>(null)

    return <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div id='grid-c' className="grid w-[200px] h-[200px] grid-cols-3 grid-rows-3 bg-amber-200">
            <GridItem />
        </div>
        <DragOverlay>
            {activeId ? <GridItem style={activeStyle} /> : null}
        </DragOverlay>
    </DndContext>

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id);
        const target = event.activatorEvent.target as HTMLElement
        setActiveStyle({
            width: target.getBoundingClientRect().width,
            height: target.getBoundingClientRect().height,
        })
    }

    function handleDragEnd() {
        setActiveId(null);
        setActiveStyle(null);
    }
}

function GridItem(props: any) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: "unique-id",
    });
    const style = {
        transform: CSS.Translate.toString(transform),
    };

    return <div ref={setNodeRef} {...props} {...listeners} {...attributes} className="grid-item  grid row-span-2 col-span-2 bg-blue-200">1</div>
}
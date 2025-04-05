import { DndContext, DragOverlay, useDraggable, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from "@dnd-kit/core";
import GridStack from "./GridStack";
import { TestGridNodeProps, type GridNodeProps } from "./type";
import GridStackContext from "./GridStackContext";

export default function GridStackSample() {
    return <GridStackContext defaultGridNodeProps={TestGridNodeProps} >
        <div className="w-[80vw] h-[60vh] flex flex-col gap-3">
            <ExternalComponents />
            <GridStack className="!h-0 flex-1" />
        </div>
    </GridStackContext>
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
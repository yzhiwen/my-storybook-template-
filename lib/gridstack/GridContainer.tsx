import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from "@dnd-kit/core";
import React, { useCallback, useEffect, useRef, useState } from "react";
import useResizable from "../dnd/useResizable";
import classNames from "classnames";
import type { GridNodeProps, GridStackProps } from "./type";
import IndexTree from "./IndexTree";
import GridItem from "./GridItem";

export default function GridContainer(props: GridNodeProps) {
    const {
        id, style, className,
        row = 5, col = 10, gap, items,
        onResizeEnd,
    } = props
    const [gridItems, setGridItems] = useState<GridNodeProps[]>([])
    const { setNodeRef } = useDroppable({ id, data: { ...props } })

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
                    {...item}
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
import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from "@dnd-kit/core";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import classNames from "classnames";
import type { GridNodeProps, GridStackProps } from "./type";
import GridItem from "./GridItem";
import GridContainerSub from "./GridContainerSub";

export default function GridContainer(props: GridNodeProps) {
    const {
        id, style, className,
        row = 5, col = 10, gap, items,
    } = props
    const [gridItems, setGridItems] = useState<GridNodeProps[]>([])
    const { node, setNodeRef } = useDroppable({ id, data: { ...props } })

    useEffect(() => {
        if (props.items) {
            setGridItems(props.items)
        }
    }, [props])

    return <div id={id}
        ref={setNodeRef}
        style={style}
        className={classNames(
            `gridstack-container`,
            `w-full`,
            `bg-amber-200`,
            // `grid grid-cols-${col} grid-rows-${row}`,
            `relative`,
            className,
        )}>
        {gridItems.map((item, index) => {
            if (item.type === 'subgrid') {
                return <GridContainerSub  {...item} />
            }
            return <GridItem {...item} key={item.id} />
        })}
        {/* {props.children} */}
    </div>
}
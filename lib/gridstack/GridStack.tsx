import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from "@dnd-kit/core";
import React, { useCallback, useEffect, useRef, useState } from "react";
import useResizable from "../dnd/useResizable";
import classNames from "classnames";
import type { GridNodeProps, GridStackProps } from "./type";
import IndexTree from "./IndexTree";
import GridContainer from "./GridContainer";
import calcGridItemArea from './calcGridItemArea'
import GridItemOverlay from "./GridItemOverlay";
import calcGridItemMoveArea from "./calcGridItemMoveArea";
import onHandleDragEnd from "./onHandleDragEnd";

// TODO
// subgrid 嵌套 subgrid
// item 如何渲染button、input等组件
// resize考虑偏移位置
// resize考虑现实预测位置

// DO
// grid-item(s)的drag
// grid-item(s)的resize
// grid-item拖入subgrid
// subgrid支持drag+resize
// drag考虑偏移位置
// drag的时候显示拖拽位置跟预测位置
// item subgrid 通过拖入创建
// subgrid的拖入拖出grid-item
export default function (props: GridStackProps) {
    const {
        disableDndContext,
        gridRoot,
        onGridRootChange,
    } = props
    const [activeArea, setActiveArea] = useState<any>(null);
    const [activeStyle, setActiveStyle] = useState<any>(null);
    console.log(gridRoot, 'gridRoot');
   
    const Context = disableDndContext ? EmptyContext : DndContext

    return <Context onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
        <GridContainer {...gridRoot} onResizeEnd={onGridItemResizeEnd} />
        <DragOverlay>
            {activeStyle ? <GridItemOverlay id="grid-item-overlay" className="bg-blue-200" style={activeStyle} /> : null}
        </DragOverlay>
    </Context>

    function handleDragStart(event: DragStartEvent) {
    }

    function handleDragEnd(event: DragEndEvent) {
        // console.log("on end", event)
        setActiveStyle(null);
        setActiveArea(null);
        const root_ = onHandleDragEnd({
            overId: event.over?.id.toString(),
            overProps: event.over?.data.current,

            activeId: event.active.id.toString(),
            activeArea: activeArea,

            root: gridRoot
        })
        console.log("on end", gridRoot, root_, activeArea)
        onGridRootChange?.(root_)
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
        console.log(gridItemMoveAreaRes, 'on move calc area res');
        if (gridItemMoveAreaRes) {
            setActiveArea(gridItemMoveAreaRes.gridItemArea)
            setActiveStyle(gridItemMoveAreaRes.overlayStyle)
        }
    }

    function onGridItemResizeEnd({ id: gridItemId }: any) {
        console.log(">>> on resize end");
        // const c = document.getElementById(id)!
        const item = document.getElementById(gridItemId)!
        const c = item.parentElement!
        const crect = c.getBoundingClientRect()
        const rect = item.getBoundingClientRect()
        const lastest = {
            width: rect.width, height: rect.height,
            x: rect.x, y: rect.y,
            left: rect.left, top: rect.top,
            right: rect.right, bottom: rect.bottom,
        }
        const activeArea = calcGridItemArea({
            row: 5, col: 10,
            x: crect.x, y: crect.y, width: crect.width, height: crect.height,
            itemX: lastest.x, itemY: lastest.y, itemWidth: lastest.width, itemHeight: lastest.height
        })

        if (true) { // parentId !== overId
            // drag的父节点未变
            const items_ = gridRoot.items?.map(item => {
                if (item.id === gridItemId) {
                    return { ...item, ...activeArea }
                }
                return { ...item }
            })
            const root_ = { ...gridRoot, items: items_ }
            onGridRootChange?.(root_)
        } else { // parentId !== overId
            // TODO
        }

        // setRootGridProps(root => {
        //     if (true) { // parentId !== overId
        //         // drag的父节点未变
        //         const items_ = root.items?.map(item => {
        //             if (item.id === gridItemId) {
        //                 return { ...item, ...activeArea }
        //             }
        //             return { ...item }
        //         })
        //         return { ...root, items: items_ }
        //     } else { // parentId !== overId
        //         // TODO
        //     }
        //     return root
        // })
    }
}

function EmptyContext(props: any) {
    return <>{props?.children}</>
} 
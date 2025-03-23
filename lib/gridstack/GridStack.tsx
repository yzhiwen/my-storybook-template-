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
// resize考虑现实预测位置
// resize subgrid

// 假如现在有一个文字、按钮组件（非容器），怎么跟gridstack的拖拽融合，数据结构怎么表示
// 假如现在有一个轮播图组件（容器），怎么跟gridstack的拖拽融合，数据结构怎么表示
// 参考_.mix思考的思路

// DO
// grid-item(s)的drag
// grid-item(s)的resize
// grid-item拖入subgrid
// subgrid支持drag+resize
// drag考虑偏移位置
// drag的时候显示拖拽位置跟预测位置
// item subgrid 通过拖入创建
// subgrid的拖入拖出grid-item
// resize考虑偏移位置
export default function (props: GridStackProps) {
    const {
        disableDndContext,
        gridRoot,
        onGridRootChange,
        onGridItemRender,
        children,
    } = props
    const [activeArea, setActiveArea] = useState<any>(null);
    const [activeStyle, setActiveStyle] = useState<any>(null);
    // console.log(gridRoot, 'gridRoot');

    const Context = disableDndContext ? EmptyContext : DndContext

    return <Context onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
        <GridContainer {...gridRoot} children={children} onResizeEnd={onGridItemResizeEnd} onGridItemRender={onGridItemRender} />
        {!disableDndContext && 
        <DragOverlay>
            {activeStyle ? <GridItemOverlay id="grid-item-overlay" className="bg-blue-200" style={activeStyle} /> : null}
        </DragOverlay>
        }
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
        if (gridItemMoveAreaRes) {
            setActiveArea(gridItemMoveAreaRes.gridItemArea)
            setActiveStyle(gridItemMoveAreaRes.overlayStyle)
        }
    }

    function onGridItemResizeEnd({ id: activeId }: any) {
        console.log(">>> on resize end");
        const tree = new IndexTree(gridRoot, 'id', 'items')
        const resizeItem = tree.get(activeId)
        const parentId = resizeItem?.parent
        const resizeParentItem = parentId ? tree.get(parentId) : undefined
        if (!parentId || !resizeParentItem) return
        const { row, col } = resizeParentItem?.node ?? {}

        const item = document.getElementById(activeId)!
        const c = document.getElementById(parentId)!
        const crect = c.getBoundingClientRect()
        const rect = item.getBoundingClientRect()
        const lastest = {
            width: rect.width, height: rect.height,
            x: rect.x, y: rect.y,
            left: rect.left, top: rect.top,
            right: rect.right, bottom: rect.bottom,
        }
        const activeArea = calcGridItemArea({
            row, col,
            x: crect.x, y: crect.y, width: crect.width, height: crect.height,
            itemX: lastest.x, itemY: lastest.y, itemWidth: lastest.width, itemHeight: lastest.height
        })

        Object.assign(resizeItem.node, activeArea)
        onGridRootChange?.({ ...gridRoot })
    }
}

function EmptyContext(props: any) {
    return <>{props?.children}</>
} 
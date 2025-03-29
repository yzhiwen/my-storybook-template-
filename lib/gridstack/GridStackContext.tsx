import { DndContext, DragOverlay, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from "@dnd-kit/core"
import React, { useContext, useEffect, useState } from "react"
import type { GridNodeProps } from "./type"
import calcGridItemMoveArea from "./calcGridItemMoveArea"
import onHandleDragEnd from "./onHandleDragEnd"
import GridItemOverlay from "./GridItemOverlay"
import calcGridItemArea from "./calcGridItemArea"
import IndexTree from "./IndexTree"
import domer from "./dom"
import classNames from "classnames"

type GridStackPayload = {
    rootGridProps: GridNodeProps
    setRootGridProps: React.Dispatch<React.SetStateAction<GridNodeProps>>
    onHandleResizeEnd?: (data: any) => void
    onGridItemRender?: (props: any) => React.ReactElement
}

export const GridStackPayloadContext = React.createContext<GridStackPayload>({} as any)

type Props = {
    className?: string
    defaultGridNodeProps: GridNodeProps
    children?: any
    onGridItemRender?: (props: any) => React.ReactElement
}

let lastest: HTMLElement | undefined = undefined
let lastestClick: HTMLElement | undefined = undefined

export default function GridStackContext(props: Props) {
    const { className, defaultGridNodeProps, onGridItemRender } = props
    const [rootGridProps, setRootGridProps] = useState<GridNodeProps>(defaultGridNodeProps)
    const [activeArea, setActiveArea] = useState<any>(null)
    const [activeStyle, setActiveStyle] = useState<any>(null)

    return <GridStackPayloadContext.Provider value={{
        rootGridProps,
        setRootGridProps,
        onHandleResizeEnd,
        onGridItemRender
    }}>
        <DndContext onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
            <div className={classNames("w-full h-full relative", className)}
                onPointerDownCapture={handleGridItemClick}
                onMouseOver={handleGridItemHover}
                onMouseOut={handleGridItemHoverOut}
            >
                {props.children}
            </div>
            <DragOverlay>
                {activeStyle ? <GridItemOverlay id="grid-item-overlay" className="bg-blue-200" style={activeStyle} /> : null}
            </DragOverlay>
        </DndContext>
    </GridStackPayloadContext.Provider>

    function handleDragStart(event: DragStartEvent) {
        // 为了外部拖入
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
        // console.log("on end", event)
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
        // onGridRootChange?.(root_)
    }

    function onHandleResizeEnd({ id: activeId }: any) {
        console.log(">>> on resize end");
        const tree = new IndexTree(rootGridProps, 'id', 'items')
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
        setRootGridProps({ ...rootGridProps })
        // onGridRootChange?.({ ...gridRoot })
    }

    function handleGridItemClick(e: any) {
        if (lastestClick !== undefined) {
            lastestClick.style.border = '1px solid transparent'
            lastestClick.style.zIndex = `auto`
        }
        const t = domer
            .parents(e.target as any)
            .find(item => item.className.includes('gridstack-item'))
        if (t) {
            t.style.border = '1px solid black'
            t.style.zIndex = `2000`
            lastestClick = t
        }
    }

    function handleGridItemHover(e: any) {
        const t = domer
            .parents(e.target as any)
            .find(item => item.className.includes('gridstack-item'))
        if (lastest !== undefined && lastest !== lastestClick) {
            lastest.style.border = '1px dashed transparent'
        }
        if (t !== undefined && t !== lastestClick) {
            t.style.border = '1px dashed red'
            lastest = t
        }
    }

    function handleGridItemHoverOut(e: any) {
        if (lastest !== undefined && lastest !== lastestClick) {
            lastest.style.border = '1px dashed transparent'
        }
    }
}

function T() {
    const { rootGridProps, setRootGridProps } = useContext(GridStackPayloadContext)
}
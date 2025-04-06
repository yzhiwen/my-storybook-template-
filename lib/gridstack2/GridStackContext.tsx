import { DndContext, DragOverlay, pointerWithin, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from "@dnd-kit/core"
import React, { useContext, useEffect, useRef, useState } from "react"
import type { GridNodeProps, PositionParams } from "./type"
import calcGridItemMoveArea from "./calcGridItemMoveArea"
import onHandleDragEnd from "./onHandleDragEnd"
import calcGridItemArea from "./calcGridItemArea"
import IndexTree from "./IndexTree"
import domer from "./dom"
import classNames from "classnames"
import { calcGridItemPosition, calcWH, calcXY } from "./utils"
import GridItemDragOverlay from "./GridItemDragOverlay"
import GridItemOutletOverlay from "./GridItemOutletOverlay"
import GridItemTooltipOverlay from "./GridItemTooltipOverlay"

type GridStackPayload = {
    rootGridProps: GridNodeProps
    rootGridTree: IndexTree
    activeArea: any
    setRootGridProps: React.Dispatch<React.SetStateAction<GridNodeProps>>
    onHandleResizeMove?: (data: any) => void
    onHandleResizeEnd?: (data: any) => void
    onGridItemRender?: (props: any) => React.ReactElement

    hoverId?: string
    clickId?: string
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
    const rootGridTree = new IndexTree(rootGridProps, 'id', 'items')

    const [hoverId, setHoverId] = useState<string>()
    const [clickId, setClickId] = useState<string>()

    return <GridStackPayloadContext.Provider value={{
        rootGridProps,
        rootGridTree,
        activeArea,
        hoverId,
        clickId,
        setRootGridProps,
        onHandleResizeMove,
        onHandleResizeEnd,
        onGridItemRender
    }}>
        <DndContext
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
        >
            <div className={classNames("w-full h-full relative", className)}
                onPointerDownCapture={handleGridItemClick}
                onMouseOver={handleGridItemHover}
                onMouseOut={handleGridItemHoverOut}
            >
                {props.children}
            </div>
            <GridItemDragOverlay id="grid-item-drag-overlay" style={activeStyle} />
            <GridItemOutletOverlay style={activeStyle} />
            <GridItemTooltipOverlay />
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
        const activeId = event.active.id.toString()!
        const overId = event.over?.id?.toString()!
        const activeEle = document.getElementById(activeId)!
        const overEle = document.getElementById(overId)
        if (!overEle) return

        const activeProps = event.active.data.current as any
        const overProps = event.over!.data.current as any
        // const x = rect.x + deltaX, y: rect.y + deltaY,

        const posParams: PositionParams = {
            margin: [0, 0],// 固定
            containerPadding: [0, 0],// 固定
            containerWidth: overEle.getBoundingClientRect().width, // 从父节点取
            cols: overProps.col, // 从父节点取
            rowHeight: 40, // 固定
            maxRows: Infinity, // 固定
        }
        // console.log('over', overProps.type, overProps.col, overEle.getBoundingClientRect().width);

        // 计算在over中的top跟left
        const left_ = activeEle.getBoundingClientRect().left - overEle.getBoundingClientRect().left + deltaX
        const top_ = activeEle.getBoundingClientRect().top - overEle.getBoundingClientRect().top + deltaY

        const { x: newX, y: newY } = calcXY(posParams, top_, left_, activeProps.w, activeProps.h)

        const pos = calcGridItemPosition(
            posParams,
            newX!,
            newY!,
            activeProps.w!,
            activeProps.h!,
        );

        // console.log('on move', pos.left, pos.top);

        setActiveStyle({
            ...activeStyle,
            // overlay展示预测的位置
            x: pos.left + overEle.getBoundingClientRect().left,
            y: pos.top + overEle.getBoundingClientRect().top,
        })

        const activeArea = {
            x: newX,
            y: newY,
            w: activeProps.w,
            h: activeProps.h,
        }
        setActiveArea(activeArea)

        // 目前，还不能在这里直接更新activeProps，会导致下次的activeEle的位置变化（跟上次值不一样，导致计算结果错误）
        // 所以高度问题，通过把activeArea提供出去给gridstack计算
        // 以后的冲突处理问题，还得看看怎么处理
    }

    function handleDragEnd(event: DragEndEvent) {
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

    function onHandleResizeMove(data: any) {
        const { id: activeId, width: width_, height: height_ } = data
        const width = Math.max(width_, 0)
        const height = Math.max(height_, 0)
        const overId = rootGridTree.get(activeId)?.parent!
        if (!activeId || !overId) return

        const activeProps = rootGridTree.get(activeId)?.node!
        const overProps = rootGridTree.get(overId)?.node!

        const overEle = document.getElementById(overId)!
        
        const posParams: PositionParams = {
            margin: [0, 0],// 固定
            containerPadding: [0, 0],// 固定
            containerWidth: overEle.getBoundingClientRect().width, // 从父节点取
            cols: overProps.col, // 从父节点取
            rowHeight: 40, // 固定
            maxRows: Infinity, // 固定
        }

        const { w, h } = calcWH(posParams, width, height, activeProps.x, activeProps.y, '')

        const pos = calcGridItemPosition(
            posParams,
            activeProps.x!,
            activeProps.y!,
            w!,
            h!,
        );

        setActiveStyle({
            ...activeStyle,
            // overlay展示预测的位置
            x: pos.left + overEle.getBoundingClientRect().left,
            y: pos.top + overEle.getBoundingClientRect().top,
            width: pos.width,
            height: pos.height,
        })

        // console.log('on reisze move', activeId, posParams, activeProps.x, activeProps.y, w, h);
        Object.assign(rootGridTree.get(activeId)!.node, { w, h })
        setRootGridProps({ ...rootGridProps })
    }

    function onHandleResizeEnd({ id: activeId }: any) {
        setActiveStyle(null)
    }

    function handleGridItemClick(e: any) {
        if (lastestClick !== undefined) {
            lastestClick.style.border = '1px solid transparent'
            lastestClick.style.zIndex = `auto`
            setClickId(undefined)
        }
        const t = domer
            .parents(e.target as any)
            .find(item => item.className.includes('gridstack-item'))
        if (t) {
            t.style.border = '1px solid black'
            t.style.zIndex = `2000`
            lastestClick = t
            setClickId(t.id)
        }
    }

    function handleGridItemHover(e: any) {
        const t = domer
            .parents(e.target as any)
            .find(item => item.className.includes('gridstack-item'))
        if (lastest !== undefined && lastest !== lastestClick) {
            lastest.style.border = '1px dashed transparent'
            setHoverId(undefined)
        }
        if (t !== undefined && t !== lastestClick) {
            t.style.border = '1px dashed red'
            lastest = t
            setHoverId(t.id)
        }
    }

    function handleGridItemHoverOut(e: any) {
        if (lastest !== undefined && lastest !== lastestClick) {
            lastest.style.border = '1px dashed transparent'
            setHoverId(undefined)
        }
    }
}

function T() {
    const { rootGridProps, setRootGridProps } = useContext(GridStackPayloadContext)
}
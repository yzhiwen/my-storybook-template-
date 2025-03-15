import { useEffect, useRef, useState } from "react";

// TODO
// 加上，resize间隔效果，resize方向，参考：https://mikkelwestermann.github.io/react-use-resizable/
// TODO
// 改写成不用resizeRef，看看dndkit内部是怎么流转的
// 例如添加ResizeContext
type UseResizableProps = {
    resizeRef?: React.RefObject<HTMLElement | null>
    centered?: boolean

    onResizeStart?: () => void
    onResizeMove?: (size: { width: number, height: number }) => void
    onResizeEnd?: (size: { width: number, height: number }) => void
}

export default function useResizable({ resizeRef, centered, onResizeStart, onResizeMove, onResizeEnd }: UseResizableProps) {
    const [isResizing, setIsResizing] = useState(false);
    const dataRef = useRef<any>({})

    const handleMouseDown = (e: PointerEvent) => {
        e.preventDefault()
        setIsResizing(true)
        dataRef.current.startWidth = resizeRef?.current?.clientWidth
        dataRef.current.startHeight = resizeRef?.current?.clientHeight
        dataRef.current.startPosX = e.clientX
        dataRef.current.startPosY = e.clientY
        onResizeStart?.()

        window.addEventListener('pointermove', handleMouseMove)
        window.addEventListener('pointerup', handleMouseUp)
    }

    const handleMouseMove = (e: any) => {
        let factor = centered ? 2 : 1 // 鼠标跟resize-handle出现偏差的处理
        const { startWidth, startHeight, startPosX, startPosY } = dataRef.current
        const newWidth = startWidth + (e.clientX - startPosX) * factor
        const newHeight = startHeight + (e.clientY - startPosY) * factor
        dataRef.current.newWidth = newWidth
        dataRef.current.newHeight = newHeight
        onResizeMove?.({ width: dataRef.current.newWidth, height: dataRef.current.newHeight })
    }

    const handleMouseUp = () => {
        setIsResizing(false)
        onResizeEnd?.({ width: dataRef.current.newWidth, height: dataRef.current.newHeight })
        window.removeEventListener('pointermove', handleMouseMove)
        window.removeEventListener('pointerup', handleMouseUp)
    }

    return {
        isResizing,
        listeners: {
            onPointerDown: handleMouseDown
        } as Record<string, Function>, // 参考DndKit的SyntheticListenerMap
    }
}

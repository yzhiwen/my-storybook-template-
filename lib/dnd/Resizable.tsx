import React, { forwardRef, useCallback, useEffect, useState } from 'react'
import classNames from 'classnames'

interface Props {
    style?: React.CSSProperties
    className?: string
    resizable?: boolean
    centered?: boolean // 如果Resizable是在父容器居中，resize会导致左右位置变化，鼠标跟resize-handle出现偏差
}

// https://github.com/clauderic/dnd-kit/issues/1127
export default function Resizable(props: Props) {
    const { style, className, resizable, centered } = props
    const [size, setSize] = useState<{ width: number, height: number } | undefined>()
    const [isResizing, setIsResizing] = useState(false)
    const [startSize, setStartSize] = useState({ width: 0, height: 0 })
    const [startPos, setStartPos] = useState({ x: 0, y: 0 })

    const handleMouseDown = (e: any) => {
        e.preventDefault()
        const target = (e.target as any)?.parentElement as HTMLDivElement
        setIsResizing(true)
        setStartSize({ width: target.clientWidth, height: target.clientHeight })
        setStartPos({ x: e.clientX, y: e.clientY })
    }

    const handleMouseMove = useCallback(
        (e: any) => {
            if (!isResizing) return
            let factor = centered ? 2 : 1 // 鼠标跟resize-handle出现偏差的处理

            const newWidth = startSize.width + (e.clientX - startPos.x) * factor
            const newHeight = startSize.height + (e.clientY - startPos.y) * factor
            setSize({ width: newWidth, height: newHeight })
        },
        [isResizing, startSize, startPos]
    )

    const handleMouseUp = () => {
        setIsResizing(false)
    }

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        } else {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isResizing, handleMouseMove])

    return (
        <div
            className={classNames(className, 'relative bg-blue-500')}
            style={{
                ...style,
                ...(size ? { width: `${size.width}px`, height: `${size.height}px` } : {}),
            }}
        >
            {resizable && (
                <div
                    className="resize-handle"
                    onMouseDown={handleMouseDown}
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '10px',
                        height: '10px',
                        backgroundColor: 'grey',
                        cursor: 'nwse-resize',
                    }}
                ></div>
            )}
        </div>
    )
}
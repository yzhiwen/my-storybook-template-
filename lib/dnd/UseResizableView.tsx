import classNames from "classnames";
import { useRef, useState } from "react";
import useResizable from "./useResizable";

export default function (props: any) {
    const { style, className, resizable, centered } = props
    const [size, setSize] = useState<{ width: number, height: number } | undefined>()
    const resizeRef = useRef<HTMLDivElement>(null)

    const { listeners } = useResizable({
        resizeRef,
        centered: true,
        onResizeMove(size) {
            setSize(size)
        },
        onResizeEnd(size) {
            setSize(size)
        },
    })

    return <div
        id="resize-c"
        ref={resizeRef}
        className={classNames(className, 'relative bg-blue-500')}
        style={{
            ...style,
            ...(size ? { width: `${size.width}px`, height: `${size.height}px` } : {}),
        }}
    >
        <div
            id="resize-handle"
            {...listeners}
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
    </div >
}
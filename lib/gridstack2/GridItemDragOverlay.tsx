import { DragOverlay } from "@dnd-kit/core"
import { useRef, useEffect } from "react"

export default function (props: any) {
    const style = {
        width: props?.style?.width,
        height: props?.style?.height,
    }

    return <DragOverlay>
        <div className="bg-green-200 z-[10000]" style={style}></div>
    </DragOverlay>

}
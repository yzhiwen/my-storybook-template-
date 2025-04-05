import { useDraggable } from "@dnd-kit/core"
import classNames from "classnames"

type Props = {
    id: string // for useDraggable
    className?: string
    children?: any
    w?: number,
    h?: number
    [key: string]: any
}

// 拖入过程：
//  GridStackContext在dragMove的时候会根据activeId获取宽高
//  GridStackContext在dragEnd的时候，会成功一个id、拖拽的gridArea位置、data、创建一个gridNode对象插入over父节点
export default function (props: Props) {
    const { id, className, children, ...otherProps } = props
    const { node, setNodeRef, listeners, attributes, } = useDraggable({
        id: `GridExternal-${id}`,
        data: {
            w: 1, h: 1,
            ...otherProps,
        },
    })

    return <div
        id={`GridExternal-${id}`}
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={classNames(className, "bg-amber-300 z-50")}>
        {children ?? id}
    </div>
}
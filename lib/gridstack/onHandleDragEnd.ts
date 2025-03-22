import IndexTree from "./IndexTree"
import type { GridAreaCalcResult } from "./calcGridItemArea"
import type { GridNodeProps } from "./type"

type Params = {
    overId?: string
    overProps?: any

    activeId: string
    activeArea: GridAreaCalcResult

    root: GridNodeProps
}

export default function onHandleDragEnd(params: Params) {
    const { activeId, overId, root, activeArea, } = params
    const tree = new IndexTree(root, 'id', 'items')
    console.log(params, tree);
    
    const activeTreeNode = tree.get(activeId)
    if (!activeTreeNode) {
        const overTreeNode = overId ? tree.get(overId) : undefined
        if (overTreeNode) {
            if (!overTreeNode.node.items) overTreeNode.node.items = []
            overTreeNode.node.items.push({ ...activeArea, id: Math.random().toString().substring(2) })
        }
        return { ...root }
    }

    const parentId = activeTreeNode.parent
    if (parentId === overId) {
        // drag的父节点未变
        const items_ = root.items?.map(item => {
            if (item.id === activeId) {
                return { ...item, ...activeArea }
            }
            return { ...item }
        })
        return { ...root, items: items_ }
    } else {
        // drag的父节点改变
        const items_ = root.items?.filter(item => item.id !== activeId)
        const item = root.items?.find(item => item.id !== activeId)
        const parent = root.items?.find(item => item.id === overId)!
        parent.items = [...(parent.items ?? []), { ...item, ...activeArea }] as any
        return { ...root, items: items_ }
    }
}
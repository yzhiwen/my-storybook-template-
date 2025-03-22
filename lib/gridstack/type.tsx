// TODO
// GridItem拖入接收
// SubGrid
// 默认参数确定
// 鼠标位置考虑

export type GridStackProps = {
    disableDndContext?: boolean
    gridRoot: GridNodeProps
    onGridRootChange?: (_: GridNodeProps) => void
    onGridItemRender?: (props: GridNodeProps) => React.ReactElement
}

export const TestGridNodeProps: GridNodeProps = {
    id: 'root',
    row: 5,
    col: 10,
    items: [
        { id: 'grid-item-1' },
        { id: 'grid-item-2', rowStart: 2, colStart: 3, rowEnd: 3, colEnd: 4 },
        { id: 'grid-item-3', },
        //  `row-start-4 col-start-5 row-span-2 col-span-3 bg-blue-700`,
        { id: 'grid-item-4', type: 'subgrid', row: 2, col: 3, rowStart: 4, colStart: 5, rowEnd: 6, colEnd: 8  }
    ]
}

export type GridNodeProps = {
    id: string
    style?: React.CSSProperties
    className?: string

    type?: "grid" | "subgrid" | "grid-item"

    // grid | subgrid
    row?: number
    col?: number
    gap?: number

    // subgrid | grid-item
    rowStart?: number
    colStart?: number
    rowEnd?: number
    colEnd?: number

    items?: GridNodeProps[]

    // 保留
    // grid-item
    onResizeEnd?: (data: any) => void

    children?: any
    onGridItemRender?: (props: any) => React.ReactElement
}
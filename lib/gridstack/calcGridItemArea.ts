

type GridAreaCalc = {
    row: number
    col: number

    x: number
    y: number
    width: number
    height: number
    // gap?

    itemX: number
    itemY: number
    itemWidth: number
    itemHeight: number
}
type GridAreaCalcResult = { rowStart: number, rowEnd: number, colStart: number, colEnd: number, 'grid-area': string, }
export default function calcGridItemArea(options: GridAreaCalc): GridAreaCalcResult {
    console.log(">>>calcGridItemArea", JSON.stringify(options))
    const rowSize = options.height / options.row
    const colSize = options.width / options.col

    console.log(">>>calcGridItemArea2",)
    // 假设完全在容器内
    let rowStart = 1;
    for (; rowStart <= options.row; rowStart += 1) {
        if (options.itemY - options.y < rowStart * rowSize) break
    }
    let colStart = 1;
    for (; colStart <= options.col; colStart += 1) {
        if (options.itemX - options.x < colStart * colSize) break
    }

    let rowSpan = 1;
    while (true) {
        if ((rowSpan + 1) * rowSize > options.itemHeight) break
        rowSpan += 1
    }
    let rowEnd = rowStart + rowSpan

    let colSpan = 1;
    while (true) {
        if ((colSpan + 1) * colSize > options.itemWidth) break
        colSpan += 1
    }
    let colEnd = colStart + colSpan
    // console.log(">>>", JSON.stringify({rowStart, rowEnd, colStart, colEnd, colSpan, rowSpan}))

    // let rowEnd = 1;
    // for (; rowEnd <= options.row; rowEnd += 1) {
    //     if (options.itemY - options.y + options.itemHeight < rowEnd * rowSize) break
    // }
    // let colEnd = 1;
    // for (; colEnd <= options.col; colEnd += 1) {
    //     if (options.itemX - options.x + options.itemWidth < colEnd * colSize) break
    // }
    return {
        rowStart, rowEnd, colStart, colEnd,
        'grid-area': `${rowStart} / ${colStart} / ${rowEnd} / ${colEnd}`
    }
}

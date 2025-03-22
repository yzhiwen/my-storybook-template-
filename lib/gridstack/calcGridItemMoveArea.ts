import calcGridItemArea, { type GridAreaCalcResult } from "./calcGridItemArea"

type Calc = {
    activeId: string
    deltaX: number
    deltaY: number
    overId?: string
    overProps?: any
}

type CalcResult = {
    gridItemArea: GridAreaCalcResult
    overlayStyle: any
}

export default function calcGridItemMoveArea(options: Calc): CalcResult | undefined {
        const { overId, activeId, deltaX, deltaY, overProps } = options
        const { row, col } = overProps ?? {}
        if (!overId || !row || !col) return undefined

        const over = document.getElementById(overId)!
        const active = document.getElementById(activeId)!

        const crect = over.getBoundingClientRect()
        const rect = active.getBoundingClientRect()
        // 没考虑鼠标
        const lastest = {
            width: rect.width, height: rect.height,
            x: rect.x + deltaX, y: rect.y + deltaY,
            left: rect.left + deltaX, top: rect.top + deltaY,
            right: rect.right + deltaX, bottom: rect.bottom + deltaY,
        }
        const area = calcGridItemArea({
            row, col,
            x: crect.x, y: crect.y, width: crect.width, height: crect.height,
            itemX: lastest.x, itemY: lastest.y, itemWidth: lastest.width, itemHeight: lastest.height
        })
        return {
            gridItemArea: area,
            overlayStyle: {
                gridArea: area["grid-area"],
                x: area.x, y: area.y,
                width: area.width, height: area.height,
            }
        }
    }
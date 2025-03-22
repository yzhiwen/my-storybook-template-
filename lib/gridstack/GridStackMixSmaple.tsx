import { useState } from "react";
import GridContainer from "./GridContainer";
import GridItem from "./GridItem";
import GridStack from "./GridStack";
import type { GridNodeProps } from "./type";

export type LowSchema = Exclude<GridNodeProps, 'items'> & {
    componentName: string;
    componenProps?: any;
    items?: LowSchema[];
}
// 对比上面LowSchema，这个LowSchemaMVP，会有两个树
// 那么势必得将GridNodeProps这个树去掉，感觉比较麻烦，后面再想想
// export type LowSchemaMVP = {
//     componentName: string;
//     componenProps?: any;
//     gridNodeProps?: GridNodeProps
//     children?: LowSchema[];
// }

const rid = () => Math.random().toString().substring(2)

export const TEST_LOW_SCHEMA: LowSchema = {
    id: rid(),
    componentName: 'page',
    componenProps: {},
    row: 5,
    col: 10,
    items: [
        {
            id: rid(),
            componentName: 'text',
            componenProps: { value: 'text组件文本内容' },
            type: 'grid-item', rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 4,
        },
        {
            id: rid(),
            componentName: 'banner',
            componenProps: {},
            type: 'grid-item', rowStart: 3, rowEnd: 3, colStart: 1, colEnd: 4,
        }
    ]
}

export function LowPage(props: any) {
    const [rootGridProps, setRootGridProps] = useState<GridNodeProps>(TEST_LOW_SCHEMA)

    return <GridStack
        gridRoot={rootGridProps!}
        onGridRootChange={(_) => setRootGridProps(_)}
        onGridItemRender={(props: any) => {
            return <LowView {...props} />
        }}
    />
}

export function LowView(props: LowSchema) {
    const { componentName, componenProps } = props
    const comps: any = {
        'text': LowText,
        'banner': LowBanner,
    }
    const LowComp = comps[componentName]
    if (!LowComp) return <>组件未实现：{componentName}</>
    return <LowComp {...componenProps} />
}

function LowText(props: any) {
    const { value } = props
    return <span className="bg-amber-600 w-full h-full block">{value}</span>
}

function LowBanner(props: any) {
    return <div>banner</div>
}
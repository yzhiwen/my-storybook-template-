import { useState } from "react";
import GridContainer from "./GridContainer";
import GridItem from "./GridItem";
import GridStack from "./GridStack";
import type { GridNodeProps } from "./type";
import ReactFullpage from "@fullpage/react-fullpage";

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
            type: 'grid-item', rowStart: 3, rowEnd: 5, colStart: 1, colEnd: 10,
            items: [
                {
                    id: 'banner-root-1',
                    componentName: 'page',
                    componenProps: {},
                    row: 5,
                    col: 10,
                    items: [
                        {
                            id: 'banner-root-1-item-text',
                            componentName: 'text',
                            componenProps: { value: 'text组件文本内容' },
                            type: 'grid-item', rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 4,
                        },
                    ]
                },
                {
                    id: 'banner-root-2',
                    componentName: 'page',
                    componenProps: {},
                    row: 5,
                    col: 10,
                    items: [
                    ]
                }
            ]
        }
    ]
}

export function LowPage(props: any) {
    const [rootGridProps, setRootGridProps] = useState<GridNodeProps>(TEST_LOW_SCHEMA)

    return <GridStack
        gridRoot={rootGridProps!}
        onGridRootChange={(_) => {
            console.log(_, 'low page');
            setRootGridProps(_)
        }}
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
    return <LowComp {...componenProps} rawProps={props} />
}

function LowText(props: any) {
    const { value } = props
    return <span className="bg-amber-600 w-full h-full block">{value}</span>
}

export function LowPageSub(props: any) {
    // const [rootGridProps, setRootGridProps] = useState<GridNodeProps>(props)

    return <GridStack
        disableDndContext
        gridRoot={props!}
        // onGridRootChange={(_) => setRootGridProps(_)}
        onGridItemRender={(props: any) => {
            return <LowView {...props} />
        }}
    />
}

function LowBanner(props: any) {
    const { rawProps } = props
    const { items } = rawProps
    return <div
        onPointerDown={(e) => {
            e.stopPropagation()
        }}>
        <ReactFullpage
            debug={false}
            slidesNavigation={true}
            controlArrows={false}
            render={() => (
                <ReactFullpage.Wrapper>
                    <div className="section" id="section1">
                        <div className="slide">
                            <LowPageSub {...items[0]} />
                        </div>
                        <div className="slide">
                            <LowPageSub {...items[1]} />
                        </div>
                        <div className="slide"><h1>Horizontal Slides</h1></div>
                    </div>
                </ReactFullpage.Wrapper>
            )}
            licenseKey="OPEN-SOURCE-GPLV3-LICENSE"
            credits={{
                enabled: undefined,
                label: '',
                position: 'right'
            }} />
    </div>
    return <div>banner</div>
}
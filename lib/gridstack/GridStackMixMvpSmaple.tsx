import { useState } from "react";
import GridContainer from "./GridContainer";
import GridItem from "./GridItem";
import GridStack from "./GridStack";
import type { GridNodeProps } from "./type";
import GridStackContext from "./GridStackContext";

export type LowSchema = {
    componentName: string;
    componenProps?: any;
    gridNodeProps?: GridNodeProps
    children?: LowSchema[];
}

export function LowView(props: LowSchema) {
    const { componentName, gridNodeProps, componenProps, children } = props
    const comps: any = {
        'page': LowPage,
        'text': LowText,
    }
    const LowComp = comps[componentName]
    if (!LowComp) return <>组件未实现：{componentName}</>
    return <LowComp {...props} />
}

function LowPage(props: LowSchema) {
    const { gridNodeProps, children } = props
    console.log(props, 'low page');
    return <GridStackContext defaultGridNodeProps={gridNodeProps!}>
        <GridStack>{children?.map(item => <LowView {...item} />)}</GridStack>
    </GridStackContext>
}

function LowText(props: LowSchema) {
    const { gridNodeProps, componenProps, children } = props
    const { value } = componenProps ?? {}
    console.log(props, 'low text');
    return <GridItem {...gridNodeProps!}>
        <span>{value}</span>
    </GridItem>
}

export const TEST_LOW_SCHEMA_MVP: LowSchema = {
    componentName: 'page',
    componenProps: {},
    gridNodeProps: { id: 'grid-root', row: 5, col: 10, },
    children: [
        {
            componentName: 'text',
            componenProps: { value: 'text组件文本内容' },
            gridNodeProps: { id: 'grid-text-1', type: 'grid-item', rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 4 },
        }
    ]
}
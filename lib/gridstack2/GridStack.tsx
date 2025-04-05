import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import type { GridNodeProps, GridStackProps } from "./type";
import GridContainer from "./GridContainer";
import { GridStackPayloadContext } from "./GridStackContext";
import { bottom } from "./utils";

// TODO
// subgrid 嵌套 subgrid

// item 如何渲染button、input等组件
// 假如现在有一个文字、按钮组件（非容器），怎么跟gridstack的拖拽融合，数据结构怎么表示
// 假如现在有一个轮播图组件（容器），怎么跟gridstack的拖拽融合，数据结构怎么表示
// 参考_.mix思考的思路

// 封装一套外部组件拖入girdstack的接口。（问题：1、DNDContext的回调事件处理依赖gridRoot，gridRoot从哪来。2、两套DNDContext能不能合并成一套）
/*
<GridStackContext>
    <div>
        <GridExternal />
        <GridExternal />
    </div>
    <GridStack />
</GridStackContext>
*/

// griditem、gridsub能力增强：增加点击回调，增加悬浮回调
// gridsub插入节点回调，表单使用。进一步，grid-tree结构变动回调
// 新增组件：基本组件：文本、图片、视频、按钮、swiper就够了
// GridStack组件能力增强，router组件，弹框组件
// griditem、gridsub能力增强：动画能力

// width跟height如何确定，col跟row如何确定？
// grid、subgrid、grid-item的这几个都怎么确定？
// 按照react-grid-layout，重构grid

// 有问题的思路：
//  grid的row的大小要固定，数量跟随高度/rowSize计算来
//  评估:10000px / 5px每行 = 2000行，24寸显示器分比率1980x1080，10000px大概十屏
//  grid的width默认w-full，height默认给min-height
//  grid的col的数量要固定，不跟随width变动，不然后期怎么做多设配，所以给个默认的先

// DO
// grid-item(s)的drag
// grid-item(s)的resize
// grid-item拖入subgrid
// subgrid支持drag+resize
// drag考虑偏移位置
// drag的时候显示拖拽位置跟预测位置
// item subgrid 通过拖入创建
// subgrid的拖入拖出grid-item
// resize考虑偏移位置
// resize考虑现实预测位置
// resize subgrid
export default function (props: GridStackProps) {
    const { className, children, } = props
    const { rootGridProps, activeArea } = useContext(GridStackPayloadContext)
    const [h, setH] = useState<number>(0)

    useEffect(() => {
        const items = activeArea ? [...rootGridProps?.items ?? [], activeArea] : rootGridProps?.items
        const maxY = bottom(items ?? [])
        setH(maxY * 40) // 会出现gridstack高度抖动，setTimeout处理无用
        
        // const token = setTimeout(() => {
        //     setH(maxY * 40)
        // }, 100)
        // return () => {
        //     clearTimeout(token)
        // }
    }, [rootGridProps, activeArea])

    console.log(h);
    return <GridContainer
        children={children}
        {...rootGridProps}
        className={rootGridProps.className + ' ' + className + ' gridstack-root '}
        style={{
            height: h,
            ...rootGridProps.style,
        }}
    />
}
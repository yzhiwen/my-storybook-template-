import { useState } from "react";
import GridContainer from "./GridContainer";
import GridItem from "./GridItem";
import GridStack from "./GridStack";
import type { GridNodeProps } from "./type";

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination'
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Mousewheel, Navigation, Pagination } from 'swiper/modules';
import GridStackContext from "./GridStackContext";

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

export function LowCodeEditor(props: any) {
    const [rootGridProps, setRootGridProps] = useState<GridNodeProps>(TEST_LOW_SCHEMA)

    return <div className="w-[80vw] h-[60vh]">
        <GridStackContext defaultGridNodeProps={rootGridProps!} onGridItemRender={(props) => <LowView {...props} />}>
            <GridStack  />
        </GridStackContext>
    </div>
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
    // console.log(props, 'LowPageSub');
    return <GridContainer {...props} />
}

function LowBanner(props: any) {
    const { rawProps } = props
    const { items } = rawProps
    return <div
        className="w-full h-full"
        // onPointerDownCapture={(e) => {
        //     e.stopPropagation()
        // }}
        // onPointerMoveCapture={(e) => {
        //     e.stopPropagation()
        // }}
        onPointerDown={(e) => {
            e.stopPropagation()
        }}>
        <Swiper
            className="w-full h-full"
            direction={'horizontal'}
            // 每页显示slide数量
            // slidesPerView={3}
            // slidesPerView={'auto'}
            // centeredSlides={true} // 如果slidesPerView为3，第一个slide显示居中
            // freeMode={true} // 不知道啥效果

            modules={[Navigation, Pagination, Mousewheel, FreeMode]}
            pagination={{ clickable: true, dynamicBullets: true }}
            navigation={false}
            mousewheel={true} // 跟随滚轮滚动
            // cssMode={true} // 不可鼠标滚动
            // allowTouchMove 改为false之后，不可鼠标滚动
            allowTouchMove={false} // https://stackoverflow.com/questions/44115954/swiper-touch-events-enable-click-but-disable-drag

        >
            <SwiperSlide className="!flex justify-center items-center">
                {/* <div onPointerDown={() => alert('click')}>dsgs</div> */}
                <LowPageSub {...items[0]} />
            </SwiperSlide>
            <SwiperSlide>
                <LowPageSub {...items[1]} />
            </SwiperSlide>
            <SwiperSlide>slide 3</SwiperSlide>
            <SwiperSlide>slide 4</SwiperSlide>
        </Swiper>
    </div>
    return <div>banner</div>
}
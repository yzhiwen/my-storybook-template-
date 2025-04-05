import { useContext, useEffect, useState } from "react";
import GridContainer from "./GridContainer";
import GridItem from "./GridItem";
import GridStack from "./GridStack";
import type { GridNodeProps } from "./type";

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination'
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Mousewheel, Navigation, Pagination } from 'swiper/modules';
import GridStackContext, { GridStackPayloadContext } from "./GridStackContext";
import GridExternal from "./GridExternal";
import classNames from "classnames";
import IndexTree from "./IndexTree";

export type LowSchema = Exclude<GridNodeProps, 'items'> & {
    componentName: string;
    componentProps?: any;
    items?: LowSchema[];
}
// 对比上面LowSchema，这个LowSchemaMVP，会有两个树
// 那么势必得将GridNodeProps这个树去掉，感觉比较麻烦，后面再想想
// export type LowSchemaMVP = {
//     componentName: string;
//     componentProps?: any;
//     gridNodeProps?: GridNodeProps
//     children?: LowSchema[];
// }

const rid = () => Math.random().toString().substring(2)

export const TEST_LOW_SCHEMA: LowSchema = {
    id: rid(),
    componentName: 'page',
    componentProps: {},
    className: 'relative',
    row: 5,
    col: 10,
    items: [
        {
            id: rid(),
            componentName: 'text',
            componentProps: { value: 'text组件文本内容' },
            type: 'grid-item',
            x: 1, y: 1, w: 4, h: 2
            // rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 4,
        },
        {
            id: rid(),
            // subgrid的componentName、componentProps属性无用
            componentName: 'text',
            componentProps: { value: 'text组件文本内容' },
            type: 'subgrid',
            col: 6, // col === w
            x: 1, y: 3, w: 6, h: 2,
            // rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 4,
            items: [
                {
                    id: rid(),
                    componentName: 'text',
                    componentProps: { value: 'text组件文本内容' },
                    type: 'grid-item',
                    x: 1, y: 1, w: 1, h: 2
                    // rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 4,
                }
            ]
        },
        {
            id: rid(),
            componentName: 'banner',
            componentProps: {},
            type: 'grid-item',
            x: 1, y: 6, w: 8, h: 2,
            // rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 4,
            items: [
                {
                    id: 'banner-root-1',
                    componentName: 'page',
                    componentProps: {},
                    row: 5,
                    col: 8, // 等于上级的w
                    items: [
                        {
                            id: 'banner-root-1-item-text',
                            componentName: 'text',
                            componentProps: { value: 'text组件文本内容' },
                            type: 'grid-item', 
                            x: 0, y: 0, w: 4, h: 1
                            // rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 4,
                        },
                    ]
                },
            ],
        },
        // {
        //     id: rid(),
        //     componentName: 'text',
        //     componentProps: { value: 'text组件文本内容' },
        //     type: 'grid-item', rowStart: 3, rowEnd: 5, colStart: 1, colEnd: 4,
        // },
        // {
        //     id: rid(),
        //     componentName: 'banner',
        //     componentProps: {},
        //     type: 'grid-item', rowStart: 3, rowEnd: 5, colStart: 1, colEnd: 10,
        //     items: [
        //         {
        //             id: 'banner-root-1',
        //             componentName: 'page',
        //             componentProps: {},
        //             row: 5,
        //             col: 10,
        //             items: [
        //                 {
        //                     id: 'banner-root-1-item-text',
        //                     componentName: 'text',
        //                     componentProps: { value: 'text组件文本内容' },
        //                     type: 'grid-item', rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 4,
        //                 },
        //             ]
        //         },
        //         {
        //             id: 'banner-root-2',
        //             componentName: 'page',
        //             componentProps: {},
        //             row: 5,
        //             col: 10,
        //             items: [
        //             ]
        //         }
        //     ]
        // },
        // {
        //     id: rid(),
        //     componentName: 'dialog',
        //     componentProps: { open: false, value: 'text组件文本内容' },
        //     className: 'block', // griditem是release
        //     type: 'grid-item', rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 4,
        //     items: [
        //         {
        //             id: 'dialog-root-1',
        //             componentName: 'page',
        //             componentProps: {},
        //             row: 5,
        //             col: 10,
        //             items: [
        //                 {
        //                     id: 'dialog-root-1-item-text',
        //                     componentName: 'text',
        //                     componentProps: { value: 'text组件文本内容' },
        //                     type: 'grid-item', rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 4,
        //                 },
        //             ]
        //         },
        //     ]
        // },
    ]
}

export function LowCodeEditor(props: any) {
    const [rootGridProps, setRootGridProps] = useState<GridNodeProps>(TEST_LOW_SCHEMA)

    return <div className="w-[80vw] h-[90vh] overflow-auto">
        <GridStackContext
            defaultGridNodeProps={rootGridProps!}
            onGridItemRender={(props) => {
                return <LowView {...props} />
            }}>
            <div className="flex flex-row gap-2 mb-2">
                <GridExternal
                    id="text"
                    componentName='text'
                    componentProps={{ value: '我是文本' }} />
                <GridExternal
                    id="image"
                    componentName='image'
                    componentProps={{ value: '我是文本' }} />
                <Setters />
            </div>
            <GridStack />
        </GridStackContext>
    </div>
}

export function LowView(props: LowSchema) {
    const { componentName, componentProps } = props
    const comps: any = {
        'text': LowText,
        'image': LowImage,
        'banner': LowBanner,
        'dialog': LowDialog,
    }
    const LowComp = comps[componentName]
    if (!LowComp) {
        return <>组件未实现：{componentName}</>
    }
    return <LowComp {...componentProps} rawProps={props} />
}

function LowText(props: any) {
    const { value } = props
    return <span className="bg-amber-600 w-full h-full block">{value}</span>
}

function LowImage(props: any) {
    const [url, setUrl] = useState<string>()
    useEffect(() => {
        fetch("https://api.thecatapi.com/v1/images/search?limit=1")
            .then(res => {
                res.json().then(res => {
                    console.log(res?.[0]?.url);
                    setUrl(res?.[0]?.url)
                })
            })
    }, [])
    return <div className={classNames('w-full h-full bg-contain bg-center bg-no-repeat',)}
        style={{
            background: `url(${url})`
        }}
    />
}

export function LowPageSub(props: any) {
    // console.log(props, 'LowPageSub');
    return <GridContainer {...props} />
}

function LowBanner(props: any) {
    const { rawProps } = props
    const { items = [] } = rawProps
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
            className="w-full h-full !z-0"
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
            {items[1] && 
                <SwiperSlide>
                    <LowPageSub {...items[1]} />
                </SwiperSlide>
            }
            <SwiperSlide>slide 3</SwiperSlide>
            <SwiperSlide>slide 4</SwiperSlide>
        </Swiper>
    </div>
    return <div>banner</div>
}

function LowDialog(props: any) {
    const { rawProps, open } = props
    const { items } = rawProps

    useEffect(() => {
        const d = document.getElementById('dialog') as HTMLDialogElement
        open ? d?.show() : d?.close()
        // d?.showModal()
    }, [open])

    return <dialog id="dialog" autoFocus={false} className={classNames(
        "bg-transparent backdrop:bg-[rgba(0,0,0,.8)]",
        "absolute left-[50%] top-[50%] translate-[-50%]",
    )}>
        <div className="bg-white w-[300px] aspect-2/1 rounded border-none"
            onPointerDown={(e) => { e.stopPropagation() }}>
            <LowPageSub className="bg-white" {...items[0]} />
        </div>
    </dialog>

    return <div className="w-full h-full z-[1002] bg-[rgba(0,0,0,.8)] absolute left-[50%] top-[50%] translate-[-50%]">
        {/* dialogf放这里 */}
    </div>

}

function Setters() {
    const { rootGridProps, setRootGridProps } = useContext(GridStackPayloadContext)
    return <>
        <div onClick={() => {
            console.log(rootGridProps);
            const item = rootGridProps.items?.[0] as any
            console.log(item);
            item.componentProps.value = '文本值' + Math.random().toString().substring(10)
            setRootGridProps({ ...rootGridProps })
        }}>点击改变文本值</div>
    </>
}
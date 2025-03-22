import GridStack from "./GridStack"
import { LowView, TEST_LOW_SCHEMA } from "./GridStackMixMvpSmaple"
import GridStackSample from "./GridStackSample"
import { TestGridNodeProps } from "./type"

type Props = {
    type?: 'mix'
}
export default function(props: Props) {
    switch(props.type) {
        case 'mix': return <LowView {...TEST_LOW_SCHEMA} />
    }
    return <GridStackSample />
    return <GridStack gridRoot={TestGridNodeProps} />
}

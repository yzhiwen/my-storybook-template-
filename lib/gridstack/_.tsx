import GridStack from "./GridStack"
import { LowView, TEST_LOW_SCHEMA_MVP } from "./GridStackMixMvpSmaple"
import { LowCodeEditor } from "./GridStackMixSmaple"
import GridStackSample from "./GridStackSample"
import { TestGridNodeProps } from "./type"

type Props = {
    type?: 'mix-mvp' | 'mix'
}
export default function(props: Props) {
    switch(props.type) {
        case 'mix-mvp': return <LowView {...TEST_LOW_SCHEMA_MVP} />
        case 'mix': return <LowCodeEditor />
    }
    return <GridStackSample />
}

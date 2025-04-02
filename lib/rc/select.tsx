import Select, { Option } from 'rc-select';
import 'rc-select/assets/index.css';

export default function () {
    return <Select
        className="border-blue-400"
        showSearch
        allowClear
        open
        onChange={(value, option) => {
            console.log('onchange', value, option);
        }}>
        <Option value="jack">jack</Option>
        <Option value="lucy">lucy</Option>
        <Option value="yiminghe">yiminghe</Option>
    </Select>
}
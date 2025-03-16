export default function () {
    return <div className="grid w-[500px] h-[300px] grid-rows-5 grid-cols-10 bg-amber-200">
        <div className="grid grid-cols-subgrid grid-rows-subgrid row-start-4 col-start-5 row-span-2 col-span-3 bg-blue-200">
            <div className="bg-amber-600 row-start-2 col-start-2 col-span-2">
                subgrid中的grid-item
            </div>
        </div>
    </div>
}
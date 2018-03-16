import {h, Component, render} from "preact"
import {areDatesEqual, adjustCalendar} from "./util"
import Month from "./Month"


export default class Calendar extends Component {
    render(props, state) {
        
        var months = [];
        for (let i = 0; i < (props.count || 1); i++) {
            let table = Object.assign({}, props);
            table.month += i;
            adjustCalendar(table);
            months.push(<Month {...table}></Month>);
        }
        
        return (
            <div>{months}</div>
        )

    }
}
import Calendar from "./components/Calendar"
import {h, Component, render} from "preact"
import {areDatesEqual} from "./components/util"




function Pikaday(options) {
    var options = options || {};
    var targetEl = options.container || document.createElement('div');
    
    render((
        <div class="pikaday">
            <Calendar year={2018} month={1} selected={new Date(2018,3,6)} count="3" language="de-ch" firstWeekday={1}></Calendar>
        </div>
    ), targetEl)
}



export default Pikaday;
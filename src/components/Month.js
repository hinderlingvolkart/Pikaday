import {h, Component, render} from "preact"
import {areDatesEqual, renderTag} from "./util"


export default class Month extends Component {
    render({language, startRange, endRange, selected, year, month, firstWeekday}, state) {
        if (!language) {
            language = 'en-us'
        }
        if (!firstWeekday) {
            firstWeekday = 0;
        }
        
        let currentDate = new Date(year, month, 1);
        
        const rows = [];
        var dif = (currentDate.getDay() - firstWeekday + 7) % 7;
        var week = new Date(currentDate);
        week.setDate(week.getDate() - dif);
        
        var now = new Date();
        
        var header = renderDays(week);
        
        do {
            rows.push(renderWeek(week));
            week.setDate(week.getDate() + 7);
        } while (week.getMonth() === currentDate.getMonth());
        
        function getDateState(day) {
            var flags = {
                today: areDatesEqual(day, now),
                selected: areDatesEqual(day, selected),
                outsideMonth: day.getMonth() !== currentDate.getMonth(),
                startRange: areDatesEqual(day, startRange),
                endRange: areDatesEqual(day, endRange)
            }
            if (startRange && endRange && !flags.startRange && !flags.endRange && endRange > day && startRange < day) {
                flags.withinRange = true;
            }
            return flags;
        }
        
        function renderWeek(date) {
            var cells = [], day = new Date(date);
            for (var i = 1; i <= 7; i++) {
                let classes = ['pika-button'];
                let state = getDateState(day);
                for (let key in state) {
                    if (state[key]) {
                        classes.push('is-' + key);
                    }
                }
                let dayView = {
                    "tag": "button",
                    "content": day.getDate(),
                    "type": "button",
                    "tabindex": state.selected ? "0" : "-1",
                    "class": classes.join(' '),
                    "aria-label": day.toLocaleDateString(language, {year: 'numeric', month: 'short', day: 'numeric', weekday: 'long'})
                };
                cells.push(<td>{renderTag(dayView)}</td>)
                day.setDate(day.getDate() + 1);
            }
            return <tr>{cells}</tr>;
        }
        
        function renderDays(date) {
            var cells = [], day = new Date(date);
            for (var i = 1; i <= 7; i++) {
                cells.push(
                    <th aria-label={day.toLocaleDateString(language, {weekday: 'long'})}>{day.toLocaleDateString(language, {weekday: 'short'})}</th>
                )
                day.setDate(day.getDate() + 1);
            }
            return <tr aria-hidden="true">{cells}</tr>;
        }
        
        return (
            <table class="calendar">
                <caption>{currentDate.toLocaleDateString(language, {year: 'numeric', month: 'long'})}</caption>
                <thead>{header}</thead>
                <tbody>{rows}</tbody>
            </table>
        )

    }
}
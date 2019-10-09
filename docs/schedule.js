

var rename_report_data = function (d) {
    return {
        term: d.Term,
        dept: d.Department,
        academic_year: +d.AcademicYear,
        section: d.SectionName,
        prefix: d.SubjectCode,
        number: d.CourseNum,
        section: d.SectionCode,
        level: d.CourseLevelCode,
        credits: d.MinimumCredits,
        load: +d.FacultyLoad,
        used: +d.Used,
        day10: +d.Day10Used,
        // LocalMax,GlobalMax,RoomCapacity,
        days: typeof (d.MeetingDays) == "string" ?
            d.MeetingDays.replace("TH", "R").split("") : [],
        // MeetingTime,
        start_date: d.SectionStartDate,
        end_date: d.SectionEndDate,
        building: d.Building,
        room_number: d.RoomNumber,
        location: d.BuildingAndRoom,
        // MeetingStart, 
        // MeetingEnd,
        start_time: time_to_date(d.MeetingStartInternal),
        end_time: time_to_date(d.MeetingEndInternal),
        // monday: d.Monday === "M",
        // tuesday: d.Tuesday === "T",
        // wednesday: d.Wednesday === "W",
        // thursday: d.Thursday === "TH",
        // friday: d.Friday === "F",
        title: d.ShortTitle,
        instructor: d.Faculty,
        status: d.SectionStatus,
        method: d.InstructionalMethod
    };
}

var time_to_date = function(s, base_date = "2000-01-01") {
    return new Date(base_date + "T" + s);
}

const time_options = {
    // year: '2-digit', month: '2-digit', 
    // day: '2-digit',
    hour: '2-digit', minute: '2-digit'
    // timeZoneName: 'short' 
};

const date_to_time = new Intl.DateTimeFormat('en-us', time_options).format;

var sections_to_sessions = function (data) {
    var sessions = [];
    data.forEach(function(d) {
        d.days.forEach(function(day) {
            sessions = sessions.concat(
                {
                    term: d.term,
                    dept: d.dept,
                    academic_year: d.academic_year,
                    section: d.section,
                    prefix: d.prefix,
                    number: d.number,
                    section: d.section,
                    level: d.level,
                    credits: d.credits,
                    load: d.load,
                    used: d.used,
                    day: day,
                    day10: d.day10,
                    days: d.days,
                    building: d.building,
                    room_number: d.room_number,
                    location: d.location,
                    start_time: d.start_time,
                    end_time: d.end_time,
                    title: d.title,
                    instructor: d.instructor,
                    status: d.status,
                    method: d.method
                }
            );
        });
    });
    return sessions;
}

var session_summary = function (d, i) {
    return ""
        + d.prefix + " " + d.number
        + " @ " + date_to_time(d.start_time)
        + " - " + date_to_time(d.end_time)
        + " in " + d.location
        + " with " + d.instructor
        + " [" + i + "]"
        ;
}

var append_item = function (x, item) {
    if (x == undefined) { x = []; }
    return (x.concat(item));
}
var sessions_to_sections = function (data) {
    result = {};
    for (i in data) {
        d = data[i];
        let key = d.prefix + "-" + d.number + "-" + d.section;
        let old = result[key];
        if (old == undefined) { old = {}; }
        result[key] = d;
        result[key].days = append_item(old.days, d.day);
        result[key].starts = append_item(old.starts, date_to_time(d.start_time));
        result[key].ends = append_item(old.ends, date_to_time(d.end_time));
    }
    for (i in result) {
        d = result[i];
        d.days = d.days.join("");
        d.starts = d.starts.join(";");
        d.ends = d.ends.join(";");
        delete result[i].start_time;
        delete result[i].end_time;
    }
    // convert to array
    result = Object.keys(result).map(k => result[k]);

    return result;
}
    
    

var export_schedule = function (filename = "exported_schedule.csv") {
    var sessions_data = d3.selectAll("rect.session").data();
    var sections_data = sessions_to_sections(sessions_data);
    console.log(sections_data);
    // console.log(d3.csvFormat(sections_data));

    var csv = 'data:text/csv;charset=utf-8,' + d3.csvFormat(sessions_data);
    data = encodeURI(csv);
    link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', filename);
    link.click();
}


rename_report_data =
    function (d) {
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
            days: typeof(d.MeetingDays) == "string" ? d.MeetingDays.replace("TH", "R").split("") : [],
            // MeetingTime,
            start_date: d.SectionStartDate,
            end_date: d.SectionEndDate,
            building: d.Building,
            room_number: d.RoomNumber,
            location: d.BuildingAndRoom,
            // MeetingStart, MeetingEnd,
            start_time: d.MeetingStartInternal,
            end_time: d.MeetingEndInternal,
            monday: d.Monday === "M",
            tuesday: d.Tuesday === "T",
            wednesday: d.Wednesday === "W",
            thursday: d.Thursday === "TH",
            friday: d.Friday === "F",
            title: d.ShortTitle,
            instructor: d.Faculty,
            status: d.SectionStatus,
            method: d.InstructionalMethod
        };
    }

time_to_date = function(s, base_date = "2000-01-01") {
    return new Date(base_date + "T" + s);
}

flat_to_structured = function (flat) {
    var sessions = [];
    flat.forEach(function(d) {
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

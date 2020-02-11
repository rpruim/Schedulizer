/**
 *
 * @param {array of objects} d
 */
function rename_report_data(d) {
  let res = {
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
    days:
      typeof d.MeetingDays == 'string'
        ? d.MeetingDays.replace('TH', 'R').split('\n')
        : [],
    // MeetingTime,
    start_date: d.SectionStartDate,
    end_date: d.SectionEndDate,
    building:
      typeof d.Building == 'string' ? d.Building.split('\n') : undefined,
    room_number:
      typeof d.RoomNumber == 'string' ? d.RoomNumber.split('\n') : undefined,
    location:
      typeof d.BuildingAndRoom == 'string'
        ? d.BuildingAndRoom.split('\n')
        : undefined,
    // MeetingStart,
    // MeetingEnd,
    start_time:
      typeof d.MeetingStartInternal == 'string'
        ? d.MeetingStartInternal.split('\n').map(d => time_to_date(d))
        : undefined,
    end_time:
      typeof d.MeetingEndInternal == 'string'
        ? d.MeetingEndInternal.split('\n').map(d => time_to_date(d))
        : undefined,
    // monday: d.Monday === "M",
    // tuesday: d.Tuesday === "T",
    // wednesday: d.Wednesday === "W",
    // thursday: d.Thursday === "TH",
    // friday: d.Friday === "F",
    title: d.ShortTitle,
    instructor: d.Faculty,
    status: d.SectionStatus,
    method: d.InstructionalMethod,
  }

  res.days = res.days.map(s => (typeof s == 'string' ? s.split('') : s))
  // console.log(res.days);
  for (let r = 0; r < res.days.length; r++) {
    let n = res.days[r].length
    ;['building', 'room_number', 'location', 'start_time', 'end_time'].forEach(
      item => {
        // console.log({ r: r, item : item, "res[item]" : res[item] });
        res[item][r] = Array(n).fill(
          res[item] == undefined ? undefined : res[item][r]
        )
      }
    )
  }

  ;['building', 'room', 'location', 'start_time', 'end_time'].forEach(item =>
    res[item] == undefined ? undefined : (res[item] = res[item].flat())
  )

  return res
}

/**
 *
 * @param {String} s time as hh:mm
 * @param {String} base_date a date string as yyyy-mm-dd
 * @returns {Date}
 */
function time_to_date(s, base_date = '2000-01-01') {
  return new Date(base_date + 'T' + s)
}

const time_options = {
  // year: '2-digit', month: '2-digit',
  // day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  // timeZoneName: 'short'
}

const date_to_time = new Intl.DateTimeFormat('en-us', time_options).format

/**
 *
 * @param {array of objects} data section-level schedule data
 * @returns {array of objects} session-level schedule data
 */
function sections_to_sessions(data) {
  var sessions = []
  data.forEach(function(d) {
    d.days.forEach(function(day) {
      sessions = sessions.concat({
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
        method: d.method,
      })
    })
  })
  return sessions
}

function session_summary(d, i) {
  return (
    '' +
    section_id(d) + // d.prefix + " " + d.number
    ' @ ' +
    date_to_time(d.start_time) +
    ' - ' +
    date_to_time(d.end_time) +
    ' on ' +
    d.day +
    ' in ' +
    d.location +
    ' with ' +
    d.instructor +
    ' [' +
    d.term +
    ']' +
    ' (' +
    i +
    ')'
  )
}

function append_item(x, item) {
  if (x == undefined) {
    x = []
  }
  return x.concat(item)
}
var sessions_to_sections = function(data) {
  result = {}
  for (i in data) {
    d = data[i]
    let key = section_id(d)
    let old = result[key]
    if (old == undefined) {
      old = {}
    }
    result[key] = d
    result[key].days = append_item(old.days, d.day)
    result[key].starts = append_item(old.starts, date_to_time(d.start_time))
    result[key].ends = append_item(old.ends, date_to_time(d.end_time))
  }
  for (i in result) {
    d = result[i]
    d.days = d.days.join('')
    d.starts = d.starts.join(';')
    d.ends = d.ends.join(';')
    delete result[i].start_time
    delete result[i].end_time
  }
  // convert to array
  result = Object.keys(result).map(k => result[k])

  return result
}

function is_session_data(data) {
  console.log(data)
  return data.length == 0 || Object.keys(data[0]).includes('day')
}

function section_id(d) {
  return d.prefix + '-' + d.number + '-' + d.section
}

function export_schedule(filename = 'exported_schedule.csv') {
  var sessions_data = d3.selectAll('rect.session').data()
  var sections_data = sessions_to_sections(sessions_data)
  console.log(sections_data)
  // console.log(d3.csvFormat(sections_data));

  var csv = 'data:text/csv;charset=utf-8,' + d3.csvFormat(sessions_data)
  data = encodeURI(csv)
  link = document.createElement('a')
  link.setAttribute('href', data)
  link.setAttribute('download', filename)
  link.click()
}

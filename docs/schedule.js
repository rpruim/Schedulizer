/**
 *
 * @param {array of objects} d
 */

// 'startTimeStr',
// 'duration',
// 'days',
// 'day',
// 'sectionID',
//   'sessionID',

function loadFile(d) {
  console.log('loading file...')
  console.log(d)
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
  } else {
    alert('The File APIs are not fully supported in this browser.')
  }

  let f = event.target.files[0] // FileList object
  console.log(f)
  let reader = new FileReader()

  reader.onload = function(event) {
    load_json(event.target.result)
  }
  // Read in the file as a data URL.
  reader.readAsDataURL(f)
}

function load_json(fileHandler) {
  d3.json(fileHandler, recodeJSON).then(d => {
    d.forEach(d => (d.startTime = new Date(d.startTime)))
    d.forEach(d => (d.endTime = new Date(d.endTime)))
    d.forEach(d => (d.load = +d.load))
    schedule = d
    renderSchedule(schedule)
  })
}
function load_csv(fileHandler) {
  d3.csv(fileHandler, rename_report_data).then(d => {
    schedule = d
    // renderSchedule(schedule)
  })
}

function recodeJSON() {
  console.log('recoding JSON')
  d.duration = +d.duration // make sure it is numeric
  d.startTime = new Date(d.startTime)
  d.endTime = new Date(d.endTime)
}

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
    startDate: d.SectionStartDate,
    endDate: d.SectionEndDate,
    building:
      typeof d.Building == 'string' ? d.Building.split('\n') : undefined,
    roomNumber:
      typeof d.RoomNumber == 'string' ? d.RoomNumber.split('\n') : undefined,
    location:
      typeof d.BuildingAndRoom == 'string'
        ? d.BuildingAndRoom.split('\n')
        : undefined,
    // MeetingStart,
    // MeetingEnd,
    startTime:
      typeof d.MeetingStartInternal == 'string'
        ? d.MeetingStartInternal.split('\n').map(d => time_to_date(d))
        : undefined,
    endTime:
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
  if (false) {
    for (let r = 0; r < res.days.length; r++) {
      let n = res.days[r].length
      ;[
        'building',
        'room_number',
        'location',
        'start_time',
        'end_time',
      ].forEach(item => {
        // console.log({ r: r, item : item, "res[item]" : res[item] });
        res[item][r] = Array(n).fill(
          res[item] == undefined ? undefined : res[item][r]
        )
      })
    }
  }

  ;['building', 'room', 'location', 'startTime', 'endTime'].forEach(item =>
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
    let d = data[i]
    let key = d.sectionID // section_id(d)
    let old = result[key]
    if (old == undefined) {
      old = {}
    }
    delete d.days
    result[key] = d
    result[key].days = append_item(old.days, d.day)
    delete result[key].day
    // result[key].starts = append_item(old.starts, date_to_time(d.start_time))
    // result[key].ends = append_item(old.ends, date_to_time(d.end_time))
  }
  for (i in result) {
    let d = result[i]
    d.days = d.days.join('')
    // d.starts = d.starts.join(';')
    // d.ends = d.ends.join(';')
    // delete result[i].start_time
    // delete result[i].end_time
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

function export_schedule(filename = '') {
  if (!filename) {
    let timeStr = new Date()
      .toLocaleString()
      .substring(0, 22)
      .replace(/[, /:]/g, '-')
      .replace(/--/g, '-')
      .replace('-??-AM', '-AM')
      .replace('-??-PM', '-PM')
    filename = `schedulizer-${timeStr}.json`
  }
  let sessions_data = d3
    .selectAll('svg#schedule-by-location rect.session')
    .data()
  // let sessions_data = schedule
  // var sections_data = sessions_to_sections(sessions_data)
  // console.log(sections_data)
  // console.log(d3.csvFormat(sections_data));

  let csv = 'data:text/csv;charset=utf-8,' + d3.csvFormat(sessions_data)
  let json = 'data:text/json;charset=utf-8,' + JSON.stringify(sessions_data)
  data = encodeURI(json)
  link = document.createElement('a')
  link.setAttribute('href', data)
  link.setAttribute('download', filename)
  link.click()
}

function abbrev(x) {
  return x
    .split(' ')
    .map(d => d[0])
    .join('')
}

function compute_loads(schedule) {
  let sections = sessions_to_sections(schedule)
  let loads = Array.from(
    d3.rollup(
      sections,
      v => d3.sum(v, d => +d.load),
      d => d.instructor
    )
  )
  let res = []
  for (d of loads) {
    res.push({ instructor: d[0], load: d[1] })
  }
  return res
}

function tally_sections(schedule) {
  let sections = sessions_to_sections(schedule)
  let loads = Array.from(
    d3.rollup(
      sections,
      v => v.length,
      d => d.prefix,
      d => d.number,
      d => d.term
    )
  )
  let res = []
  for (d of loads) {
    res.push({ prefix: d[0], number: d[1], term: d[2], count: d[3] })
  }
  return res
}

function sort_schedule(schedule) {
  return sessions_to_sections(schedule)
    .sort((a, b) => a.term > b.term)
    .sort((a, b) => a.number - b.number)
}
